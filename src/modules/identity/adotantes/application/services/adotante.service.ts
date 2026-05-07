import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';
import {
  ADOTANTE_REPOSITORY,
  type AdotanteRepository,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import { AdotanteResponseDto } from '@identity/adotantes/application/dto/adotante-response.dto';
import { AtualizarAdotanteDto } from '@identity/adotantes/application/dto/atualizar-adotante.dto';
import { CriarAdotanteDto } from '@identity/adotantes/application/dto/criar-adotante.dto';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import {
  ENDERECO_REPOSITORY,
  type EnderecoRepository,
} from '@identity/enderecos/domain/repositories/endereco-repository.interface';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@identity/usuarios/domain/ports/password-hasher.interface';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';

/**
 * Service de aplicação do sub-módulo Adotantes.
 *
 * Orquestra o cadastro atômico:
 *   endereço (opcional) → usuário → adotante
 * em uma única transação Drizzle. Se qualquer passo falha, tudo desfaz.
 */
@Injectable()
export class AdotanteService {
  constructor(
    private readonly drizzle: DrizzleService,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(ADOTANTE_REPOSITORY)
    private readonly adotanteRepository: AdotanteRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: EnderecoRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async criar(dto: CriarAdotanteDto): Promise<AdotanteResponseDto> {
    // ── Pré-checagens fora da transação (não segurar lock à toa) ────────
    const emailJaUsado =
      await this.usuarioRepository.buscarPorEmail(dto.email);
    if (emailJaUsado) {
      throw new ConflictException('Email já cadastrado');
    }

    const cpfJaUsado = await this.adotanteRepository.buscarPorCpf(dto.cpf);
    if (cpfJaUsado) {
      throw new ConflictException('CPF já cadastrado');
    }

    // ── Hash da senha fora da transação (operação cara) ─────────────────
    const senhaHash = await this.passwordHasher.hash(dto.senha);

    // ── Transação atômica ───────────────────────────────────────────────
    return this.drizzle.db.transaction(async (tx) => {
      // 1. Endereço (obrigatório no cadastro)
      const endereco = Endereco.criar({
        logradouro: dto.endereco.logradouro,
        numero: dto.endereco.numero,
        complemento: dto.endereco.complemento,
        bairro: dto.endereco.bairro,
        cidade: dto.endereco.cidade,
        estado: dto.endereco.estado,
        cep: dto.endereco.cep,
      });
      const enderecoSalvo = await this.enderecoRepository.criar(endereco, tx);

      // 2. Usuário (tipoUsuario sempre 'adotante' aqui — controller crava)
      const usuario = Usuario.criar({
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        telefone: dto.telefone,
        tipoUsuario: TipoUsuario.Adotante,
      });
      const usuarioSalvo = await this.usuarioRepository.criar(usuario, tx);

      // 3. Adotante
      const adotante = Adotante.criar({
        usuarioId: usuarioSalvo.id!,
        cpf: dto.cpf,
        enderecoId: enderecoSalvo.id!,
        imagemBase64: dto.imagemBase64,
      });
      const adotanteSalvo = await this.adotanteRepository.criar(adotante, tx);

      return AdotanteResponseDto.montar({
        adotante: adotanteSalvo,
        usuario: usuarioSalvo,
        endereco: enderecoSalvo,
      });
    });
  }

  /**
   * Retorna o perfil completo (usuário + adotante + endereço) do
   * adotante autenticado.
   *
   * Autorização:
   * - O `usuarioId` vem do JWT (não há como pedir outro pelo endpoint /me).
   * - Bloqueia tipoUsuario != 'adotante' com 403, evitando que protetor/ong
   *   bata neste endpoint só pra ver se existe perfil de adotante.
   *
   * Retorna 404 se o usuário existe no JWT mas não tem perfil de adotante
   * (caso defensivo — não deveria ocorrer porque o cadastro é atômico).
   */
  async buscarMeuPerfil(
    autenticadoId: string,
    autenticadoTipo: TipoUsuario,
  ): Promise<AdotanteResponseDto> {
    if (autenticadoTipo !== TipoUsuario.Adotante) {
      throw new ForbiddenException(
        'Endpoint disponível apenas para usuários do tipo adotante',
      );
    }

    const adotante =
      await this.adotanteRepository.buscarPorUsuarioId(autenticadoId);
    if (!adotante) {
      throw new NotFoundException('Perfil de adotante não encontrado');
    }

    const usuario = await this.usuarioRepository.buscarPorId(autenticadoId);
    if (!usuario) {
      // Defensivo: o JWT é válido, então o usuário deveria existir.
      throw new NotFoundException('Usuário não encontrado');
    }

    let endereco: Endereco | null = null;
    if (adotante.enderecoId) {
      endereco = await this.enderecoRepository.buscarPorId(adotante.enderecoId);
    }

    return AdotanteResponseDto.montar({ adotante, usuario, endereco });
  }

  /**
   * Atualiza o perfil do adotante autenticado (usuário + adotante +
   * endereço) numa única transação.
   *
   * Endereço:
   * - `dto.endereco === undefined` (omitido) → não mexe.
   * - `dto.endereco === objeto`              → atualiza in-place o atual.
   *
   * Não aceita `null` (endereço é obrigatório no perfil) — class-validator
   * já rejeita esse caso no DTO.
   */
  async atualizarMeuPerfil(
    autenticadoId: string,
    autenticadoTipo: TipoUsuario,
    dto: AtualizarAdotanteDto,
  ): Promise<AdotanteResponseDto> {
    if (autenticadoTipo !== TipoUsuario.Adotante) {
      throw new ForbiddenException(
        'Endpoint disponível apenas para usuários do tipo adotante',
      );
    }

    const adotanteAtual =
      await this.adotanteRepository.buscarPorUsuarioId(autenticadoId);
    if (!adotanteAtual) {
      throw new NotFoundException('Perfil de adotante não encontrado');
    }

    const usuarioAtual = await this.usuarioRepository.buscarPorId(autenticadoId);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.drizzle.db.transaction(async (tx) => {
      // ── Endereço (atualiza in-place quando enviado) ─────────────────
      let enderecoFinal: Endereco | null = null;
      if (!adotanteAtual.enderecoId) {
        // Defensivo: o cadastro exige endereço, então isso não deveria
        // acontecer. Se acontecer, é dado inconsistente do banco.
        throw new NotFoundException(
          'Endereço do adotante não encontrado (estado inconsistente)',
        );
      }

      if (dto.endereco !== undefined) {
        const existente = await this.enderecoRepository.buscarPorId(
          adotanteAtual.enderecoId,
        );
        if (!existente) {
          throw new NotFoundException(
            'Endereço atual referenciado não foi encontrado',
          );
        }
        existente
          .withLogradouro(dto.endereco.logradouro)
          .withNumero(dto.endereco.numero)
          .withComplemento(dto.endereco.complemento)
          .withBairro(dto.endereco.bairro)
          .withCidade(dto.endereco.cidade)
          .withEstado(dto.endereco.estado)
          .withCep(dto.endereco.cep);
        enderecoFinal = await this.enderecoRepository.atualizar(existente, tx);
      } else {
        enderecoFinal = await this.enderecoRepository.buscarPorId(
          adotanteAtual.enderecoId,
        );
      }

      // ── Usuario (sem email — imutável após cadastro) ────────────────
      if (dto.nome !== undefined) usuarioAtual.withNome(dto.nome);
      if (dto.telefone !== undefined) usuarioAtual.withTelefone(dto.telefone);
      const usuarioAtualizado = await this.usuarioRepository.atualizar(
        usuarioAtual,
        tx,
      );

      // ── Adotante ────────────────────────────────────────────────────
      if (dto.imagemBase64 !== undefined) {
        adotanteAtual.withImagemBase64(dto.imagemBase64);
      }
      const adotanteAtualizado = await this.adotanteRepository.atualizar(
        adotanteAtual,
        tx,
      );

      return AdotanteResponseDto.montar({
        adotante: adotanteAtualizado,
        usuario: usuarioAtualizado,
        endereco: enderecoFinal,
      });
    });
  }
}

import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import {
  ENDERECO_REPOSITORY,
  type EnderecoRepository,
} from '@identity/enderecos/domain/repositories/endereco-repository.interface';
import { AtualizarProtetorOngDto } from '@identity/protetores_ongs/application/dto/atualizar-protetor-ong.dto';
import { CriarProtetorOngDto } from '@identity/protetores_ongs/application/dto/criar-protetor-ong.dto';
import { ProtetorOngResponseDto } from '@identity/protetores_ongs/application/dto/protetor-ong-response.dto';
import { ProtetorOng } from '@identity/protetores_ongs/domain/models/protetor-ong.entity';
import {
  PROTETOR_ONG_REPOSITORY,
  type ProtetorOngRepository,
} from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
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
 * Service de aplicação do sub-módulo Protetores/ONGs.
 *
 * Mesmo padrão do AdotanteService: cadastro atômico em transação Drizzle,
 * envolvendo endereço (opcional) → usuário → protetor/ong.
 */
@Injectable()
export class ProtetorOngService {
  constructor(
    private readonly drizzle: DrizzleService,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorOngRepository: ProtetorOngRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: EnderecoRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async criar(dto: CriarProtetorOngDto): Promise<ProtetorOngResponseDto> {
    // ── Pré-checagens ──────────────────────────────────────────────────
    const emailJaUsado = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (emailJaUsado) {
      throw new ConflictException('Email já cadastrado');
    }

    const cpfCnpjJaUsado = await this.protetorOngRepository.buscarPorCpfCnpj(
      dto.cpfCnpj,
    );
    if (cpfCnpjJaUsado) {
      throw new ConflictException('CPF/CNPJ já cadastrado');
    }

    const senhaHash = await this.passwordHasher.hash(dto.senha);

    // tipoUsuario do DTO ('protetor'|'ong') → enum do domínio
    const tipoUsuarioEnum =
      dto.tipoUsuario === 'protetor' ? TipoUsuario.Protetor : TipoUsuario.Ong;

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

      // 2. Usuário
      const usuario = Usuario.criar({
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        telefone: dto.telefone,
        tipoUsuario: tipoUsuarioEnum,
      });
      const usuarioSalvo = await this.usuarioRepository.criar(usuario, tx);

      // 3. Protetor/ONG
      const protetor = ProtetorOng.criar({
        usuarioId: usuarioSalvo.id!,
        cpfCnpj: dto.cpfCnpj,
        descricao: dto.descricao,
        telefoneContato: dto.telefoneContato,
        imagemBase64: dto.imagemBase64,
        documentoComprobatorio: dto.documentoComprobatorio,
        enderecoId: enderecoSalvo.id!,
      });
      const protetorSalvo = await this.protetorOngRepository.criar(
        protetor,
        tx,
      );

      return ProtetorOngResponseDto.montar({
        protetorOng: protetorSalvo,
        usuario: usuarioSalvo,
        endereco: enderecoSalvo,
      });
    });
  }

  /**
   * Retorna o perfil completo (usuário + protetor/ong + endereço) do
   * usuário autenticado. Atende tanto protetor PF quanto ONG PJ — quem
   * decide é o `tipoUsuario` no JWT.
   *
   * Autorização:
   * - O `usuarioId` vem do JWT (não há como pedir outro pelo /me).
   * - Bloqueia tipoUsuario != 'protetor' e != 'ong' com 403.
   *
   * Retorna 404 se o usuário existe mas não tem perfil filho (defensivo).
   */
  async buscarMeuPerfil(
    autenticadoId: string,
    autenticadoTipo: TipoUsuario,
  ): Promise<ProtetorOngResponseDto> {
    if (
      autenticadoTipo !== TipoUsuario.Protetor &&
      autenticadoTipo !== TipoUsuario.Ong
    ) {
      throw new ForbiddenException(
        'Endpoint disponível apenas para usuários do tipo protetor ou ong',
      );
    }

    const protetor =
      await this.protetorOngRepository.buscarPorUsuarioId(autenticadoId);
    if (!protetor) {
      throw new NotFoundException('Perfil de protetor/ong não encontrado');
    }

    const usuario = await this.usuarioRepository.buscarPorId(autenticadoId);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let endereco: Endereco | null = null;
    if (protetor.enderecoId) {
      endereco = await this.enderecoRepository.buscarPorId(protetor.enderecoId);
    }

    return ProtetorOngResponseDto.montar({
      protetorOng: protetor,
      usuario,
      endereco,
    });
  }

  /**
   * Atualiza o perfil do protetor/ONG autenticado (usuário + filha +
   * endereço) numa única transação.
   *
   * Imutáveis: cpfCnpj, tipoUsuario, email, senha, documentoComprobatorio.
   *
   * Endereço:
   * - omitido         → não mexe.
   * - objeto completo → atualiza in-place.
   *
   * Não aceita `null` (endereço é obrigatório).
   */
  async atualizarMeuPerfil(
    autenticadoId: string,
    autenticadoTipo: TipoUsuario,
    dto: AtualizarProtetorOngDto,
  ): Promise<ProtetorOngResponseDto> {
    if (
      autenticadoTipo !== TipoUsuario.Protetor &&
      autenticadoTipo !== TipoUsuario.Ong
    ) {
      throw new ForbiddenException(
        'Endpoint disponível apenas para usuários do tipo protetor ou ong',
      );
    }

    const protetorAtual =
      await this.protetorOngRepository.buscarPorUsuarioId(autenticadoId);
    if (!protetorAtual) {
      throw new NotFoundException('Perfil de protetor/ong não encontrado');
    }

    const usuarioAtual =
      await this.usuarioRepository.buscarPorId(autenticadoId);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.drizzle.db.transaction(async (tx) => {
      // ── Endereço (atualiza in-place quando enviado) ─────────────────
      let enderecoFinal: Endereco | null = null;
      if (!protetorAtual.enderecoId) {
        throw new NotFoundException(
          'Endereço do protetor/ong não encontrado (estado inconsistente)',
        );
      }

      if (dto.endereco !== undefined) {
        const existente = await this.enderecoRepository.buscarPorId(
          protetorAtual.enderecoId,
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
          protetorAtual.enderecoId,
        );
      }

      // ── Usuario (sem email — imutável) ──────────────────────────────
      if (dto.nome !== undefined) usuarioAtual.withNome(dto.nome);
      if (dto.telefone !== undefined) usuarioAtual.withTelefone(dto.telefone);
      const usuarioAtualizado = await this.usuarioRepository.atualizar(
        usuarioAtual,
        tx,
      );

      // ── Protetor/ONG (sem documentoComprobatorio — imutável) ────────
      if (dto.descricao !== undefined)
        protetorAtual.withDescricao(dto.descricao);
      if (dto.telefoneContato !== undefined)
        protetorAtual.withTelefoneContato(dto.telefoneContato);
      if (dto.imagemBase64 !== undefined)
        protetorAtual.withImagemBase64(dto.imagemBase64);
      const protetorAtualizado = await this.protetorOngRepository.atualizar(
        protetorAtual,
        tx,
      );

      return ProtetorOngResponseDto.montar({
        protetorOng: protetorAtualizado,
        usuario: usuarioAtualizado,
        endereco: enderecoFinal,
      });
    });
  }
}

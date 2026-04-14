import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AlterarSenhaDto } from '@identity/usuarios/application/dto/alterar-senha.dto';
import { AtualizarUsuarioDto } from '@identity/usuarios/application/dto/atualizar-usuario.dto';
import { CriarUsuarioDto } from '@identity/usuarios/application/dto/criar-usuario.dto';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@identity/usuarios/domain/ports/password-hasher.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';

/**
 * Service de aplicação do bounded context Usuarios.
 * Orquestra entidade + repositório + hasher. Toda regra de autorização
 * (ownership check) também vive aqui, junto com a regra de negócio.
 */
@Injectable()
export class UsuarioService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /**
   * Cria um novo usuário (registro). Lança ConflictException se o email
   * já existir. Hasheia a senha antes de persistir.
   */
  async criar(dto: CriarUsuarioDto): Promise<Usuario> {
    // Check otimista — o repositório também captura erro de unique constraint
    // como defesa contra race condition entre o check e o insert.
    const existente = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (existente) {
      throw new ConflictException('Email já cadastrado');
    }

    const senhaHash = await this.passwordHasher.hash(dto.senha);

    const usuario = Usuario.criar({
      nome: dto.nome,
      email: dto.email,
      senhaHash,
      telefone: dto.telefone,
      imagemBase64: dto.imagemBase64,
      tipoUsuario: dto.tipoUsuario,
    });

    return this.usuarioRepository.criar(usuario);
  }

  /**
   * Busca um usuário pelo id.
   * Regra de autorização: só o próprio usuário pode acessar seus dados.
   * Retorna 403 se um usuário tentar buscar dados de outro.
   */
  async buscarPorId(id: string, solicitanteId: string): Promise<Usuario> {
    if (id !== solicitanteId) {
      throw new ForbiddenException(
        'Não é permitido acessar dados de outro usuário',
      );
    }
    return this.buscarOuFalhar(id);
  }

  /**
   * Retorna o próprio usuário (usado pelo GET /users/me).
   * Não precisa de ownership check porque o id vem do JWT do próprio
   * solicitante — não há como pedir outro.
   */
  async buscarPerfilProprio(solicitanteId: string): Promise<Usuario> {
    return this.buscarOuFalhar(solicitanteId);
  }

  /**
   * Atualiza dados do usuário.
   * Regra de autorização: somente o próprio usuário pode editar seus dados.
   */
  async atualizar(
    id: string,
    dto: AtualizarUsuarioDto,
    solicitanteId: string,
  ): Promise<Usuario> {
    if (id !== solicitanteId) {
      throw new ForbiddenException('Não é permitido alterar outro usuário');
    }

    const usuario = await this.buscarOuFalhar(id);

    if (dto.nome !== undefined) {
      usuario.withNome(dto.nome);
    }

    if (dto.email !== undefined && dto.email !== usuario.email) {
      // Email mudou: precisa checar duplicação contra outro usuário.
      const existente = await this.usuarioRepository.buscarPorEmail(dto.email);
      if (existente && existente.id !== id) {
        throw new ConflictException('Email já cadastrado');
      }
      usuario.withEmail(dto.email);
    }

    if (dto.telefone !== undefined) {
      usuario.withTelefone(dto.telefone);
    }

    if (dto.imagemBase64 !== undefined) {
      usuario.withImagemBase64(dto.imagemBase64);
    }

    await this.usuarioRepository.atualizar(usuario);
    return usuario;
  }

  /**
   * Troca a senha do usuário autenticado.
   * Exige a senha atual para confirmação (defesa em profundidade).
   */
  async alterarSenha(
    solicitanteId: string,
    dto: AlterarSenhaDto,
  ): Promise<Usuario> {
    const usuario = await this.buscarOuFalhar(solicitanteId);

    const senhaConfere = await this.passwordHasher.compare(
      dto.senhaAtual,
      usuario.senhaHash,
    );
    if (!senhaConfere) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const novoHash = await this.passwordHasher.hash(dto.senhaNova);
    usuario.withSenhaHash(novoHash);

    await this.usuarioRepository.atualizar(usuario);
    return usuario;
  }

  /**
   * Soft delete: seta ativo = false. Não apaga a linha do banco.
   * Regra de autorização: somente o próprio usuário pode desativar a conta.
   */
  async desativar(id: string, solicitanteId: string): Promise<void> {
    if (id !== solicitanteId) {
      throw new ForbiddenException('Não é permitido desativar outro usuário');
    }

    // Garante que existe antes de tentar desativar (404 se não).
    await this.buscarOuFalhar(id);

    await this.usuarioRepository.desativar(id);
    await this.refreshTokenRepository.revokeAllForUser(id);
  }

  // ------------------------------------------------------------------
  // helpers privados
  // ------------------------------------------------------------------

  /**
   * Busca crua por id, sem checar permissão. Lança NotFoundException
   * se o usuário não existir ou estiver inativo.
   *
   * Uso: chamado internamente por outros métodos do service que JÁ
   * fizeram a checagem de autorização adequada (ou não precisam — caso
   * de buscarPerfilProprio e alterarSenha, onde o id vem do próprio JWT).
   *
   * NUNCA expor esse método publicamente — quem chama é responsável
   * por ter validado a permissão antes.
   */
  private async buscarOuFalhar(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario || !usuario.ativo) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return usuario;
  }
}

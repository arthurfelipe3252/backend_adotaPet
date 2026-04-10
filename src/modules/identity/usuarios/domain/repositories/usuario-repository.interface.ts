import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';

/**
 * Token de injeção de dependência. Usar com @Inject(USUARIO_REPOSITORY).
 */
export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

/**
 * Contrato do repositório de usuários. A implementação concreta vive em
 * infra/repositories/drizzle-usuario.repository.ts.
 */
export interface UsuarioRepository {
  /**
   * Insere um novo usuário e retorna a entidade com id gerado.
   * Lança ConflictException se o email já existir (capturando código 23505).
   */
  criar(usuario: Usuario): Promise<Usuario>;

  /**
   * Atualiza os campos mutáveis do usuário e seta updated_at = now.
   */
  atualizar(usuario: Usuario): Promise<void>;

  /**
   * Soft delete: seta ativo = false e updated_at = now. Não apaga a linha.
   */
  desativar(id: string): Promise<void>;

  /**
   * Busca por id. Retorna null se não encontrar (inclui inativos).
   */
  buscarPorId(id: string): Promise<Usuario | null>;

  /**
   * Busca por email (case-insensitive). Retorna null se não encontrar.
   * Inclui usuários inativos — quem chama (login) decide o que fazer.
   */
  buscarPorEmail(email: string): Promise<Usuario | null>;
}

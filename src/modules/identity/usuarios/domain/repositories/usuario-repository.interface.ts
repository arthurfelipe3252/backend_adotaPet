import type { DbExecutor } from '@shared/infra/database/types';
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
   *
   * @param executor Opcional. Quando o caller já abriu uma transação Drizzle
   *                 (ex: cadastro atômico de adotante/protetor), passe `tx`
   *                 aqui para participar da mesma transação. Se omitido, usa
   *                 o `db` raiz do DrizzleService.
   */
  criar(usuario: Usuario, executor?: DbExecutor): Promise<Usuario>;

  /**
   * Atualiza os campos mutáveis do usuário e seta updated_at = now.
   * Retorna a entidade reconstruída com o novo `updatedAt` do banco.
   *
   * @param executor Opcional. Para participar de transação aberta em
   *                 camada superior (ex: PATCH /users/adotantes/me).
   */
  atualizar(usuario: Usuario, executor?: DbExecutor): Promise<Usuario>;

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

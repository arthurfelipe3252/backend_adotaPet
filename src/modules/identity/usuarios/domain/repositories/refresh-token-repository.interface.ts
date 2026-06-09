import { RefreshToken } from '@identity/usuarios/domain/models/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

/**
 * Contrato do repositório de refresh tokens.
 */
export interface RefreshTokenRepository {
  /**
   * Insere um novo refresh token e retorna a entidade com id gerado.
   */
  create(token: RefreshToken): Promise<RefreshToken>;

  /**
   * Busca pelo hash SHA-256 do token (que é o que está armazenado no banco).
   */
  findByHash(tokenHash: string): Promise<RefreshToken | null>;

  /**
   * Marca um token como revogado (revoked_at = now).
   */
  revoke(id: string): Promise<void>;

  /**
   * Revoga TODOS os refresh tokens ativos de um usuário (logout em todos os dispositivos).
   */
  revokeAllForUser(usuarioId: string): Promise<void>;

  /**
   * Operação atômica: revoga o token antigo E insere o novo numa única transação.
   * Se duas requests tentarem rotacionar o mesmo token simultaneamente,
   * só uma consegue (a outra falha com UnauthorizedException).
   * Isso é a defesa contra reuso/replay de refresh token.
   */
  rotate(oldId: string, newToken: RefreshToken): Promise<RefreshToken>;
}

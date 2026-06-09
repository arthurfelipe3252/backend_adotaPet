import type { RefreshToken } from '../models/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepository {
  create(token: RefreshToken): Promise<void>;
  update(token: RefreshToken): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeAllByUsuario(usuarioId: string): Promise<void>;
}

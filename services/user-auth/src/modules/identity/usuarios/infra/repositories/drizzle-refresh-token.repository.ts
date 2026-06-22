import { Injectable, UnauthorizedException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { RefreshToken } from '@identity/usuarios/domain/models/refresh-token.entity';
import { RefreshTokenRepository } from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import { refreshTokensSchema } from '@identity/usuarios/infra/schemas/refresh-tokens.schema';

type RefreshTokenRow = typeof refreshTokensSchema.$inferSelect;

@Injectable()
export class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(token: RefreshToken): Promise<RefreshToken> {
    const [row] = await this.drizzle.db
      .insert(refreshTokensSchema)
      .values({
        usuarioId: token.usuarioId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
      })
      .returning();

    return RefreshToken.restore(this.toDomain(row))!;
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(refreshTokensSchema)
      .where(eq(refreshTokensSchema.tokenHash, tokenHash))
      .limit(1);

    return RefreshToken.restore(row ? this.toDomain(row) : null);
  }

  async revoke(id: string): Promise<void> {
    await this.drizzle.db
      .update(refreshTokensSchema)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokensSchema.id, id),
          isNull(refreshTokensSchema.revokedAt),
        ),
      );
  }

  async revokeAllForUser(usuarioId: string): Promise<void> {
    await this.drizzle.db
      .update(refreshTokensSchema)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokensSchema.usuarioId, usuarioId),
          isNull(refreshTokensSchema.revokedAt),
        ),
      );
  }

  /**
   * Operação atômica de rotação. Dentro de uma transação:
   * 1. UPDATE no token antigo SET revoked_at = NOW WHERE id = ? AND revoked_at IS NULL
   *    - Se já foi revogado por outra request concorrente, o WHERE não encontra
   *      nada, o RETURNING vem vazio, e lançamos UnauthorizedException.
   *      Isso é a defesa contra reuso/replay de refresh token.
   * 2. INSERT do novo token.
   */
  async rotate(oldId: string, newToken: RefreshToken): Promise<RefreshToken> {
    return this.drizzle.db.transaction(async (tx) => {
      const [revoked] = await tx
        .update(refreshTokensSchema)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokensSchema.id, oldId),
            isNull(refreshTokensSchema.revokedAt),
          ),
        )
        .returning();

      if (!revoked) {
        throw new UnauthorizedException('Refresh token já utilizado');
      }

      const [inserted] = await tx
        .insert(refreshTokensSchema)
        .values({
          usuarioId: newToken.usuarioId,
          tokenHash: newToken.tokenHash,
          expiresAt: newToken.expiresAt,
          userAgent: newToken.userAgent,
          ipAddress: newToken.ipAddress,
        })
        .returning();

      return RefreshToken.restore(this.toDomain(inserted))!;
    });
  }

  private toDomain(row: RefreshTokenRow) {
    return {
      id: row.id,
      usuarioId: row.usuarioId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
    };
  }
}

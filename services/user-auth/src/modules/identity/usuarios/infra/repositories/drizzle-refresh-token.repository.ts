import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { RefreshToken } from '@identity/usuarios/domain/models/refresh-token.entity';
import type { RefreshTokenRepository } from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import { refreshTokensSchema, type RefreshTokenRow } from '../database/schemas/refresh-tokens.schema';

@Injectable()
export class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private toEntity(row: RefreshTokenRow): RefreshToken {
    return RefreshToken.restore({
      id: row.id,
      usuarioId: row.usuarioId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    })!;
  }

  async create(token: RefreshToken): Promise<void> {
    await this.drizzle.db.insert(refreshTokensSchema).values({
      id: token.id!,
      usuarioId: token.usuarioId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
    });
  }

  async update(token: RefreshToken): Promise<void> {
    await this.drizzle.db.update(refreshTokensSchema).set({
      revokedAt: token.revokedAt ?? null,
    }).where(eq(refreshTokensSchema.id, token.id!));
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const rows = await this.drizzle.db.select().from(refreshTokensSchema)
      .where(eq(refreshTokensSchema.tokenHash, tokenHash)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async revokeAllByUsuario(usuarioId: string): Promise<void> {
    await this.drizzle.db.update(refreshTokensSchema).set({ revokedAt: new Date() })
      .where(eq(refreshTokensSchema.usuarioId, usuarioId));
  }
}

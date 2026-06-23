import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { and, eq, isNull } from 'drizzle-orm';
import { PasswordResetToken } from '@identity/usuarios/domain/models/password-reset-token.entity';
import { PasswordResetTokenRepository } from '@identity/usuarios/domain/repositories/password-reset-token-repository.interface';
import { passwordResetTokensSchema } from '@identity/usuarios/infra/schemas/password-reset-tokens.schema';

type PasswordResetTokenRow = typeof passwordResetTokensSchema.$inferSelect;

@Injectable()
export class DrizzlePasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async create(token: PasswordResetToken): Promise<PasswordResetToken> {
    const [row] = await this.drizzle.db
      .insert(passwordResetTokensSchema)
      .values({
        usuarioId: token.usuarioId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to insert password reset token');
    }

    const domain = this.toDomain(row);
    const restored = PasswordResetToken.restore(domain);
    if (!restored) {
      throw new Error('Failed to restore PasswordResetToken from database row');
    }

    return restored;
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(passwordResetTokensSchema)
      .where(eq(passwordResetTokensSchema.tokenHash, tokenHash))
      .limit(1);

    return PasswordResetToken.restore(row ? this.toDomain(row) : null);
  }

  async markAsUsed(id: string): Promise<void> {
    await this.drizzle.db
      .update(passwordResetTokensSchema)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokensSchema.id, id),
          isNull(passwordResetTokensSchema.usedAt),
        ),
      );
  }

  async invalidateAllForUser(usuarioId: string): Promise<void> {
    await this.drizzle.db
      .update(passwordResetTokensSchema)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokensSchema.usuarioId, usuarioId),
          isNull(passwordResetTokensSchema.usedAt),
        ),
      );
  }

  private toDomain(row: PasswordResetTokenRow) {
    return {
      id: row.id,
      usuarioId: row.usuarioId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
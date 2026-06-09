import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usuariosSchema } from './usuarios.schema';

export const refreshTokensSchema = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull().references(() => usuariosSchema.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type RefreshTokenRow = typeof refreshTokensSchema.$inferSelect;

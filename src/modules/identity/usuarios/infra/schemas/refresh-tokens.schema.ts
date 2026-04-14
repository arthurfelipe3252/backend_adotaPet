import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usuariosSchema } from '@identity/usuarios/infra/schemas/usuarios.schema';

/**
 * Schema Drizzle da tabela `refresh_tokens`.
 *
 * A FK pra `usuariosSchema` é INTRA bounded context (identity → identity),
 * portanto permitida pelas regras de DDD do projeto. Cross-context teria
 * que ser FK lógica (só uuid + comentário).
 *
 * IMPORTANTE: NÃO rodar `npm run db:generate` após editar este arquivo.
 */
export const refreshTokensSchema = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuariosSchema.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  userAgent: varchar('user_agent', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

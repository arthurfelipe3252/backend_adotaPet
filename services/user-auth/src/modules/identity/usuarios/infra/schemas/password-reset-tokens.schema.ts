// @ts-ignore: module resolution for drizzle-orm types sometimes fails in the workspace
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usuariosSchema } from '@identity/usuarios/infra/schemas/usuarios.schema';

/**
 * Schema Drizzle da tabela `password_reset_tokens`.
 *
 * Espelha o padrão de `refresh_tokens`: nunca armazenamos o token em texto
 * puro, só o hash SHA-256 dele. O token plano só existe em memória durante
 * a request e dentro do e-mail enviado ao usuário.
 *
 * IMPORTANTE: NÃO rodar `npm run db:generate` após editar este arquivo.
 * A migration SQL correspondente já foi escrita à mão em
 * drizzle/0001_password_reset_tokens.sql.
 */
export const passwordResetTokensSchema = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuariosSchema.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
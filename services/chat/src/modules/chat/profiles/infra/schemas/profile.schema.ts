import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Réplica local de resumos de perfil (adotantes/protetores_ongs), alimentada por
 * eventos do user-auth. Popula `conversation.adopter`/`.protetor` = {id, nome} e
 * `message.sender` = {id, nome, tipo}.
 */
export const profilesSchema = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type ProfileRow = typeof profilesSchema.$inferSelect;

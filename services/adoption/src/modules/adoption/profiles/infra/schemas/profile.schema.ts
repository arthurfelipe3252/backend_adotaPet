import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Réplica local de resumos de perfil (adotantes/protetores_ongs), alimentada por
 * eventos do user-auth. Usada pra popular `adoption.adopter`/`.protetor` = {id, nome}.
 */
export const profilesSchema = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type ProfileRow = typeof profilesSchema.$inferSelect;

import { char, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Schema Drizzle da tabela `enderecos`.
 *
 * A tabela já é criada pela migration manual `0001_initial_v2.sql`.
 * Este schema só descreve a estrutura para o Drizzle conseguir construir
 * queries tipadas — não gera migration nova (`db:generate` está desligado).
 */
export const enderecosSchema = pgTable('enderecos', {
  id: uuid('id').primaryKey().defaultRandom(),
  logradouro: varchar('logradouro', { length: 255 }).notNull(),
  numero: varchar('numero', { length: 20 }).notNull(),
  complemento: varchar('complemento', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }).notNull(),
  cidade: varchar('cidade', { length: 100 }).notNull(),
  estado: char('estado', { length: 2 }).notNull(),
  cep: char('cep', { length: 8 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type EnderecoRow = typeof enderecosSchema.$inferSelect;

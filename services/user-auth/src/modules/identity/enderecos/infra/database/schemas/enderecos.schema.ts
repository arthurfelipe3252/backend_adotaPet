import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const enderecosSchema = pgTable('enderecos', {
  id: uuid('id').primaryKey().defaultRandom(),
  cep: varchar('cep', { length: 10 }).notNull(),
  logradouro: varchar('logradouro', { length: 255 }).notNull(),
  numero: varchar('numero', { length: 20 }).notNull(),
  complemento: varchar('complemento', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }).notNull(),
  cidade: varchar('cidade', { length: 100 }).notNull(),
  estado: varchar('estado', { length: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EnderecoRow = typeof enderecosSchema.$inferSelect;

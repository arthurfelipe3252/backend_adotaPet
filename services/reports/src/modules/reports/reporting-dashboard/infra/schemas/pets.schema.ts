import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const reportPetsSchema = pgTable('report_pets', {
  id: uuid('id').primaryKey(),
  protetorId: uuid('protetor_id').notNull(),
  nome: varchar('nome', { length: 100 }).notNull(),
  especie: text('especie').notNull(),
  porte: text('porte').notNull(),
  status: text('status').notNull().default('disponivel'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

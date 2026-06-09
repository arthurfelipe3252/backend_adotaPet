import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const petsLocalSchema = pgTable('pets_local', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: uuid('external_id').notNull().unique(),
  nome: text('nome').notNull(),
  status: text('status').notNull(),
  protetorId: uuid('protetor_id').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PetLocalRow = typeof petsLocalSchema.$inferSelect;

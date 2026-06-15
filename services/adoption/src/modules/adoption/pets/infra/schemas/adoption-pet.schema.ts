import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Réplica local mínima dos pets do catalog, alimentada por eventos RabbitMQ
 * (CatalogPetConsumer). O adoption só precisa do `protetorId` por `petId` pra
 * preencher o dono da solicitação e fazer a checagem de posse na aprovação.
 * `id` vem do catalog (sem defaultRandom).
 */
export const adoptionPetsSchema = pgTable('adoption_pets', {
  id: uuid('id').primaryKey(),
  protetorId: uuid('protetor_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type AdoptionPetRow = typeof adoptionPetsSchema.$inferSelect;

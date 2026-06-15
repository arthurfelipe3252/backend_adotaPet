import {
  boolean,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Réplica local (read-model) dos pets do catalog, alimentada por eventos
 * RabbitMQ (CatalogPetConsumer). Espelha os campos do catalog que o motor de
 * match precisa pra pontuar (especie, porte, temperamento) e pra exibir no
 * resultado. Enums viram `text()` — read-model não precisa de constraint.
 * `id` vem do catalog (sem defaultRandom). `fotosUrls` guardado como JSON string.
 */
export const matchPetsSchema = pgTable('match_pets', {
  id: uuid('id').primaryKey(),
  protetorId: uuid('protetor_id').notNull(),
  nome: varchar('nome', { length: 100 }).notNull(),
  especie: text('especie').notNull(),
  raca: varchar('raca', { length: 100 }),
  porte: text('porte').notNull(),
  sexo: text('sexo').notNull(),
  idadeMeses: smallint('idade_meses').notNull(),
  castrado: boolean('castrado').notNull().default(false),
  vacinado: boolean('vacinado').notNull().default(false),
  temperamento: text('temperamento'),
  status: text('status').notNull().default('disponivel'),
  fotosUrls: text('fotos_urls'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type MatchPetRow = typeof matchPetsSchema.$inferSelect;
export type NewMatchPetRow = typeof matchPetsSchema.$inferInsert;

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  smallint,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const especieEnum = pgEnum("especie", ["cao", "gato", "outro"]);
export const porteEnum = pgEnum("porte", ["pequeno", "medio", "grande"]);
export const sexoEnum = pgEnum("sexo", ["macho", "femea"]);
export const petStatusEnum = pgEnum("pet_status", [
  "disponivel",
  "em_processo",
  "adotado",
]);

export const petsSchema = pgTable("pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  // FK lógica → identity.protetores_ongs.id. Sem FK física porque cruza
  // bounded contexts (catalog → identity), o que é vedado pelas regras de
  // DDD do projeto (ver CLAUDE.md). A integridade fica a cargo do serviço.
  protetorId: uuid("protetor_id").notNull(),
  nome: varchar("nome", { length: 100 }).notNull(),
  especie: especieEnum("especie").notNull(),
  raca: varchar("raca", { length: 100 }),
  porte: porteEnum("porte").notNull(),
  sexo: sexoEnum("sexo").notNull(),
  idadeMeses: smallint("idade_meses").notNull(),
  castrado: boolean("castrado").notNull().default(false),
  vacinado: boolean("vacinado").notNull().default(false),
  descricao: text("descricao"),
  temperamento: text("temperamento"),
  status: petStatusEnum("status").notNull().default("disponivel"),
  fotosUrls: text("fotos_urls"), // JSON array de base64/URLs, ex: '["data:image/jpeg;base64,...","..."]'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type PetRow = typeof petsSchema.$inferSelect;
export type NewPetRow = typeof petsSchema.$inferInsert;

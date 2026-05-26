import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const tipoMoradiaEnum = pgEnum("tipo_moradia", [
  "casa_quintal_grande",
  "casa_quintal_pequeno",
  "apartamento",
  "apartamento_lazer",
]);

export const disponibilidadeEnum = pgEnum("disponibilidade_match", [
  "fica_em_casa",
  "sai_almoco",
  "passa_dia_fora",
  "viaja_frequentemente",
]);

export const experienciaPreviaEnum = pgEnum("experiencia_previa", [
  "sim_tem_experiencia",
  "sim_faz_tempo",
  "nunca_quer_aprender",
  "primeiro_pet_familia",
]);

export const criancasEmCasaEnum = pgEnum("criancas_em_casa", [
  "bebe",
  "crianca_pequena",
  "crianca_maior",
  "nao",
]);

export const outrosPetsEnum = pgEnum("outros_pets_match", [
  "cao",
  "gato",
  "outros",
  "nao",
]);

export const perfilCompatheiroEnum = pgEnum("perfil_companheiro", [
  "tranquilo",
  "energetico",
  "carinhoso",
  "inteligente",
]);

export const questionarioMatchSchema = pgTable("questionario_match", {
  id: uuid("id").primaryKey().defaultRandom(),
  // FK lógica → identity.adotantes.id. Sem FK física (bounded context cruzado).
  adotanteId: uuid("adotante_id").notNull().unique(),
  tipoMoradia: tipoMoradiaEnum("tipo_moradia").notNull(),
  disponibilidade: disponibilidadeEnum("disponibilidade").notNull(),
  experienciaPrevia: experienciaPreviaEnum("experiencia_previa").notNull(),
  criancasEmCasa: criancasEmCasaEnum("criancas_em_casa").notNull(),
  outrosPets: outrosPetsEnum("outros_pets").notNull(),
  perfilCompanheiro: perfilCompatheiroEnum("perfil_companheiro").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type QuestionarioMatchRow = typeof questionarioMatchSchema.$inferSelect;
export type NewQuestionarioMatchRow = typeof questionarioMatchSchema.$inferInsert;

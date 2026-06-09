import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usuariosSchema } from '../../../../usuarios/infra/database/schemas/usuarios.schema';
import { enderecosSchema } from '../../../../enderecos/infra/database/schemas/enderecos.schema';

export const protetoresOngsSchema = pgTable('protetores_ongs', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull().unique().references(() => usuariosSchema.id, { onDelete: 'cascade' }),
  cnpjCpf: varchar('cnpj_cpf', { length: 18 }).notNull().unique(),
  nomeOrganizacao: varchar('nome_organizacao', { length: 150 }),
  enderecoId: uuid('endereco_id').notNull().references(() => enderecosSchema.id),
  descricao: text('descricao'),
  imagemBase64: text('imagem_base64'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProtetorOngRow = typeof protetoresOngsSchema.$inferSelect;

import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usuariosSchema } from '../../../../usuarios/infra/database/schemas/usuarios.schema';
import { enderecosSchema } from '../../../../enderecos/infra/database/schemas/enderecos.schema';

export const adotantesSchema = pgTable('adotantes', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull().unique().references(() => usuariosSchema.id, { onDelete: 'cascade' }),
  cpf: varchar('cpf', { length: 14 }).notNull().unique(),
  enderecoId: uuid('endereco_id').notNull().references(() => enderecosSchema.id),
  imagemBase64: text('imagem_base64'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AdotanteRow = typeof adotantesSchema.$inferSelect;

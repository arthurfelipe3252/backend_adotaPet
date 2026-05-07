import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { enderecosSchema } from '@identity/enderecos/infra/schemas/enderecos.schema';
import { usuariosSchema } from '@identity/usuarios/infra/schemas/usuarios.schema';

/**
 * Schema Drizzle da tabela `protetores_ongs`.
 *
 * Armazena tanto protetores PF (cpf_cnpj com 11 dígitos) quanto ONGs
 * (cpf_cnpj com 14 dígitos). A diferença é discriminada em
 * `usuarios.tipo_usuario`.
 *
 * `imagem_base64` (renomeada de `url_foto_perfil`) e
 * `documento_comprobatorio` são adicionados pela migration 0002.
 *
 * IMPORTANTE: NÃO rodar `db:generate`. As migrations são manuais.
 */
export const protetoresOngsSchema = pgTable('protetores_ongs', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .unique()
    .references(() => usuariosSchema.id, { onDelete: 'cascade' }),
  cpfCnpj: varchar('cpf_cnpj', { length: 14 }).notNull().unique(),
  descricao: text('descricao'),
  telefoneContato: varchar('telefone_contato', { length: 20 }),
  imagemBase64: text('imagem_base64'),
  documentoComprobatorio: text('documento_comprobatorio'),
  enderecoId: uuid('endereco_id')
    .unique()
    .references(() => enderecosSchema.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProtetorOngRow = typeof protetoresOngsSchema.$inferSelect;

import { char, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { enderecosSchema } from '@identity/enderecos/infra/schemas/enderecos.schema';
import { usuariosSchema } from '@identity/usuarios/infra/schemas/usuarios.schema';

/**
 * Schema Drizzle da tabela `adotantes`.
 *
 * FKs físicas para `usuarios` e `enderecos` são intra-bounded-context
 * (identity → identity), portanto permitidas pela arquitetura DDD do projeto.
 *
 * `imagem_base64` é adicionada pela migration 0002 (foto de perfil migrou
 * de `usuarios` para a entidade filha).
 *
 * IMPORTANTE: NÃO rodar `db:generate` após editar — as migrations da
 * tabela são manuais (0001 cria; 0002 adiciona imagem_base64).
 */
export const adotantesSchema = pgTable('adotantes', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .unique()
    .references(() => usuariosSchema.id, { onDelete: 'cascade' }),
  cpf: char('cpf', { length: 11 }).notNull().unique(),
  enderecoId: uuid('endereco_id')
    .unique()
    .references(() => enderecosSchema.id, { onDelete: 'set null' }),
  imagemBase64: text('imagem_base64'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdotanteRow = typeof adotantesSchema.$inferSelect;

import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Enum espelhando o tipo `tipo_usuario` do PostgreSQL.
 * O nome do enum aqui ('tipo_usuario') precisa ser exatamente o mesmo da
 * migration manual em src/shared/infra/database/drizzle/0001_initial_v2.sql.
 */
export const tipoUsuarioEnum = pgEnum('tipo_usuario', [
  'adotante',
  'protetor',
  'ong',
]);

/**
 * Schema Drizzle da tabela `usuarios`.
 *
 * IMPORTANTE: NÃO rodar `npm run db:generate` após criar/editar este arquivo.
 * A migration SQL já foi escrita à mão e aplicada — o generate criaria uma
 * migration diff que conflitaria com a manual.
 */
export const usuariosSchema = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
  telefone: varchar('telefone', { length: 20 }),
  tipoUsuario: tipoUsuarioEnum('tipo_usuario').notNull(),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

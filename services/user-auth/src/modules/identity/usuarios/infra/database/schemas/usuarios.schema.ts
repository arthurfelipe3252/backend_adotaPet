import { boolean, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const tipoUsuarioEnum = pgEnum('tipo_usuario', ['adotante', 'protetor_ong', 'admin']);

export const usuariosSchema = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
  telefone: varchar('telefone', { length: 20 }),
  tipoUsuario: tipoUsuarioEnum('tipo_usuario').notNull(),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UsuarioRow = typeof usuariosSchema.$inferSelect;

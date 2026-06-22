import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const reportConversationsSchema = pgTable('report_conversations', {
  id: uuid('id').primaryKey(),
  adopterId: uuid('adopter_id').notNull(),
  protetorId: uuid('protetor_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const reportMessagesSchema = pgTable('report_messages', {
  id: uuid('id').primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  senderId: uuid('sender_id').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

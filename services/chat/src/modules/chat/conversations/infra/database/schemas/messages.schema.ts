import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const messagesSchema = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').notNull(),
    senderId: uuid('sender_id').notNull(),
    content: text('content').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    convCreatedIdx: index('idx_messages_conversation_created_at').on(table.conversationId, table.createdAt),
  }),
);

export type MessageRow = typeof messagesSchema.$inferSelect;

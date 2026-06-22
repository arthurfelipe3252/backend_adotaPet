import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const reportAdoptionRequestsSchema = pgTable('report_adoption_requests', {
  id: uuid('id').primaryKey(),
  petId: uuid('pet_id').notNull(),
  protetorId: uuid('protetor_id'),
  adopterId: uuid('adopter_id').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

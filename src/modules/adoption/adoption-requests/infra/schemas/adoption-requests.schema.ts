import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const adoptionRequestsSchema = pgTable('adoption_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').notNull(),
  protetorId: uuid('protetor_id'),
  adopterId: uuid('adopter_id').notNull(),
  status: text('status').notNull(),
  preTriageStatus: text('pre_triage_status').notNull(),
  matchScore: integer('match_score'),
  matchAnswers: jsonb('match_answers'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

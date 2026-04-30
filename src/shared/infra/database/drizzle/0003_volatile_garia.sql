CREATE TABLE "adoption_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"adopter_id" uuid NOT NULL,
	"status" text NOT NULL,
	"pre_triage_status" text NOT NULL,
	"match_score" integer,
	"match_answers" jsonb,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

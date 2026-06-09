CREATE TABLE "adoption_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"protetor_id" uuid,
	"adopter_id" uuid NOT NULL,
	"status" text NOT NULL,
	"pre_triage_status" text NOT NULL,
	"match_score" integer,
	"match_answers" jsonb,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets_local" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"status" text NOT NULL,
	"protetor_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pets_local_external_id_unique" UNIQUE("external_id")
);

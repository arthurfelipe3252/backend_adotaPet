CREATE TABLE "report_adoption_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pet_id" uuid NOT NULL,
	"protetor_id" uuid,
	"adopter_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"adopter_id" uuid NOT NULL,
	"protetor_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_pets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"protetor_id" uuid NOT NULL,
	"nome" varchar(100) NOT NULL,
	"especie" text NOT NULL,
	"porte" text NOT NULL,
	"status" text DEFAULT 'disponivel' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "adoption_request_id" uuid NOT NULL UNIQUE,
  "adopter_id" uuid NOT NULL,
  "protetor_id" uuid NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_conversations_adopter" ON "conversations" ("adopter_id");
--> statement-breakpoint
CREATE INDEX "idx_conversations_protetor" ON "conversations" ("protetor_id");
--> statement-breakpoint
CREATE INDEX "idx_conversations_request" ON "conversations" ("adoption_request_id");
--> statement-breakpoint
CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "content" text NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_created_at" ON "messages" ("conversation_id", "created_at");

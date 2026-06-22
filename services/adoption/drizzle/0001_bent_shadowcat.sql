CREATE TABLE "adoption_pets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"protetor_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "match_pets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"protetor_id" uuid NOT NULL,
	"nome" varchar(100) NOT NULL,
	"especie" text NOT NULL,
	"raca" varchar(100),
	"porte" text NOT NULL,
	"sexo" text NOT NULL,
	"idade_meses" smallint NOT NULL,
	"castrado" boolean DEFAULT false NOT NULL,
	"vacinado" boolean DEFAULT false NOT NULL,
	"temperamento" text,
	"status" text DEFAULT 'disponivel' NOT NULL,
	"fotos_urls" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

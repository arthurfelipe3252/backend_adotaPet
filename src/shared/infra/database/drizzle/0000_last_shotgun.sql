DO $$ BEGIN
	CREATE TYPE "public"."especie" AS ENUM('cao', 'gato', 'outro');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."pet_status" AS ENUM('disponivel', 'em_processo', 'adotado');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."porte" AS ENUM('pequeno', 'medio', 'grande');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."sexo" AS ENUM('macho', 'femea');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
-- protetor_id é FK lógica → identity.protetores_ongs.id (cross-context).
-- Sem REFERENCES por design (DDD: bounded contexts não devem ter FK físicas
-- entre si). A integridade é responsabilidade da camada de serviço.
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protetor_id" uuid NOT NULL,
	"nome" varchar(100) NOT NULL,
	"especie" "especie" NOT NULL,
	"raca" varchar(100),
	"porte" "porte" NOT NULL,
	"sexo" "sexo" NOT NULL,
	"idade_meses" smallint NOT NULL,
	"castrado" boolean DEFAULT false NOT NULL,
	"vacinado" boolean DEFAULT false NOT NULL,
	"descricao" text,
	"temperamento" text,
	"status" "pet_status" DEFAULT 'disponivel' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TYPE "public"."especie" AS ENUM('cao', 'gato', 'outro');--> statement-breakpoint
CREATE TYPE "public"."pet_status" AS ENUM('disponivel', 'em_processo', 'adotado');--> statement-breakpoint
CREATE TYPE "public"."porte" AS ENUM('pequeno', 'medio', 'grande');--> statement-breakpoint
CREATE TYPE "public"."sexo" AS ENUM('macho', 'femea');--> statement-breakpoint
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
	"fotos_urls" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

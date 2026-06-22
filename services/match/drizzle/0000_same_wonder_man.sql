CREATE TYPE "public"."criancas_em_casa" AS ENUM('bebe', 'crianca_pequena', 'crianca_maior', 'nao');--> statement-breakpoint
CREATE TYPE "public"."disponibilidade_match" AS ENUM('fica_em_casa', 'sai_almoco', 'passa_dia_fora', 'viaja_frequentemente');--> statement-breakpoint
CREATE TYPE "public"."experiencia_previa" AS ENUM('sim_tem_experiencia', 'sim_faz_tempo', 'nunca_quer_aprender', 'primeiro_pet_familia');--> statement-breakpoint
CREATE TYPE "public"."outros_pets_match" AS ENUM('cao', 'gato', 'outros', 'nao');--> statement-breakpoint
CREATE TYPE "public"."perfil_companheiro" AS ENUM('tranquilo', 'energetico', 'carinhoso', 'inteligente');--> statement-breakpoint
CREATE TYPE "public"."tipo_moradia" AS ENUM('casa_quintal_grande', 'casa_quintal_pequeno', 'apartamento', 'apartamento_lazer');--> statement-breakpoint
CREATE TABLE "questionario_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adotante_id" uuid NOT NULL,
	"tipo_moradia" "tipo_moradia" NOT NULL,
	"disponibilidade" "disponibilidade_match" NOT NULL,
	"experiencia_previa" "experiencia_previa" NOT NULL,
	"criancas_em_casa" "criancas_em_casa" NOT NULL,
	"outros_pets" "outros_pets_match" NOT NULL,
	"perfil_companheiro" "perfil_companheiro" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "questionario_match_adotante_id_unique" UNIQUE("adotante_id")
);

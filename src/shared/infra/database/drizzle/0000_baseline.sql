CREATE TYPE "public"."especie" AS ENUM('cao', 'gato', 'outro');--jp> statement-breakpoint
CREATE TYPE "public"."pet_status" AS ENUM('disponivel', 'em_processo', 'adotado');--> statement-breakpoint
CREATE TYPE "public"."porte" AS ENUM('pequeno', 'medio', 'grande');--> statement-breakpoint
CREATE TYPE "public"."sexo" AS ENUM('macho', 'femea');--> statement-breakpoint
CREATE TYPE "public"."tipo_usuario" AS ENUM('adotante', 'protetor', 'ong');--> statement-breakpoint
CREATE TYPE "public"."criancas_em_casa" AS ENUM('bebe', 'crianca_pequena', 'crianca_maior', 'nao');--> statement-breakpoint
CREATE TYPE "public"."disponibilidade_match" AS ENUM('fica_em_casa', 'sai_almoco', 'passa_dia_fora', 'viaja_frequentemente');--> statement-breakpoint
CREATE TYPE "public"."experiencia_previa" AS ENUM('sim_tem_experiencia', 'sim_faz_tempo', 'nunca_quer_aprender', 'primeiro_pet_familia');--> statement-breakpoint
CREATE TYPE "public"."outros_pets_match" AS ENUM('cao', 'gato', 'outros', 'nao');--> statement-breakpoint
CREATE TYPE "public"."perfil_companheiro" AS ENUM('tranquilo', 'energetico', 'carinhoso', 'inteligente');--> statement-breakpoint
CREATE TYPE "public"."tipo_moradia" AS ENUM('casa_quintal_grande', 'casa_quintal_pequeno', 'apartamento', 'apartamento_lazer');--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adoption_request_id" uuid NOT NULL,
	"adopter_id" uuid NOT NULL,
	"protetor_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_adoption_request_id_unique" UNIQUE("adoption_request_id")
);
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
CREATE TABLE "adotantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"cpf" char(11) NOT NULL,
	"endereco_id" uuid,
	"imagem_base64" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "adotantes_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "adotantes_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "adotantes_endereco_id_unique" UNIQUE("endereco_id")
);
--> statement-breakpoint
CREATE TABLE "enderecos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logradouro" varchar(255) NOT NULL,
	"numero" varchar(20) NOT NULL,
	"complemento" varchar(100),
	"bairro" varchar(100) NOT NULL,
	"cidade" varchar(100) NOT NULL,
	"estado" char(2) NOT NULL,
	"cep" char(8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protetores_ongs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"cpf_cnpj" varchar(14) NOT NULL,
	"descricao" text,
	"telefone_contato" varchar(20),
	"imagem_base64" text,
	"documento_comprobatorio" text,
	"endereco_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "protetores_ongs_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "protetores_ongs_cpf_cnpj_unique" UNIQUE("cpf_cnpj"),
	CONSTRAINT "protetores_ongs_endereco_id_unique" UNIQUE("endereco_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" varchar(255),
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(150) NOT NULL,
	"email" varchar(150) NOT NULL,
	"senha_hash" varchar(255) NOT NULL,
	"telefone" varchar(20),
	"tipo_usuario" "tipo_usuario" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "adotantes" ADD CONSTRAINT "adotantes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adotantes" ADD CONSTRAINT "adotantes_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protetores_ongs" ADD CONSTRAINT "protetores_ongs_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protetores_ongs" ADD CONSTRAINT "protetores_ongs_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_created_at" ON "messages" USING btree ("conversation_id","created_at");
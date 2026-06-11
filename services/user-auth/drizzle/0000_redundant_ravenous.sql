CREATE TYPE "public"."tipo_usuario" AS ENUM('adotante', 'protetor', 'ong');--> statement-breakpoint
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
ALTER TABLE "adotantes" ADD CONSTRAINT "adotantes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adotantes" ADD CONSTRAINT "adotantes_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protetores_ongs" ADD CONSTRAINT "protetores_ongs_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protetores_ongs" ADD CONSTRAINT "protetores_ongs_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
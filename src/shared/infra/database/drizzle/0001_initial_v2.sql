-- Migration v2 - Schema AdotaPet (módulos identity, match, adoption, chat, geo + fotos_pets)
-- Convertida de MySQL Workbench para PostgreSQL 16
-- Convenções: schema public, tabelas em plural, timestamptz, created_at/updated_at em snake_case
-- Sucede: 0000_last_shotgun.sql (cria pets + enums especie/porte/sexo/pet_status no schema public)

-- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------
-- Enums
-- -----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE tipo_usuario       AS ENUM ('adotante', 'protetor', 'ong');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE tipo_moradia       AS ENUM ('casa_quintal', 'apartamento', 'casa_sem_quintal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE disponibilidade    AS ENUM ('alta', 'media', 'baixa');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- BOUNDED CONTEXT: identity (users)
-- =====================================================

-- -----------------------------------------------------
-- Table enderecos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS enderecos (
  id          uuid                      NOT NULL DEFAULT gen_random_uuid(),
  logradouro  varchar(255)              NOT NULL,
  numero      varchar(20)               NOT NULL,
  complemento varchar(100),
  bairro      varchar(100)              NOT NULL,
  cidade      varchar(100)              NOT NULL,
  estado      char(2)                   NOT NULL,
  cep         char(8)                   NOT NULL,
  created_at  timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_enderecos PRIMARY KEY (id)
);

-- -----------------------------------------------------
-- Table usuarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id           uuid                      NOT NULL DEFAULT gen_random_uuid(),
  nome         varchar(150)              NOT NULL,
  email        varchar(150)              NOT NULL,
  senha_hash   varchar(255)              NOT NULL,
  telefone     varchar(20),
  imagem_base64 text,
  tipo_usuario tipo_usuario              NOT NULL,
  ativo        boolean                   NOT NULL DEFAULT true,
  created_at   timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios             PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email       UNIQUE (email),
  CONSTRAINT ck_usuarios_email_lower CHECK (email = LOWER(email))
);

-- -----------------------------------------------------
-- Table adotantes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS adotantes (
  id          uuid                      NOT NULL DEFAULT gen_random_uuid(),
  usuario_id  uuid                      NOT NULL,
  cpf         char(11)                  NOT NULL,
  endereco_id uuid,
  created_at  timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_adotantes          PRIMARY KEY (id),
  CONSTRAINT uq_adotantes_usuario  UNIQUE (usuario_id),
  CONSTRAINT uq_adotantes_cpf      UNIQUE (cpf),
  CONSTRAINT uq_adotantes_endereco UNIQUE (endereco_id),
  CONSTRAINT fk_adotantes_usuario  FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_adotantes_endereco FOREIGN KEY (endereco_id)
    REFERENCES enderecos (id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Table protetores_ongs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS protetores_ongs (
  id               uuid                      NOT NULL DEFAULT gen_random_uuid(),
  usuario_id       uuid                      NOT NULL,
  cpf_cnpj         varchar(14)               NOT NULL,
  descricao        text,
  telefone_contato varchar(20),
  url_foto_perfil  varchar(500),
  endereco_id      uuid,
  created_at       timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_protetores_ongs          PRIMARY KEY (id),
  CONSTRAINT uq_protetores_ongs_usuario  UNIQUE (usuario_id),
  CONSTRAINT uq_protetores_ongs_cpf_cnpj UNIQUE (cpf_cnpj),
  CONSTRAINT uq_protetores_ongs_endereco UNIQUE (endereco_id),
  CONSTRAINT fk_protetores_ongs_usuario  FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_protetores_ongs_endereco FOREIGN KEY (endereco_id)
    REFERENCES enderecos (id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Table refresh_tokens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         uuid                      NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid                      NOT NULL,
  token_hash varchar(255)              NOT NULL,
  expires_at timestamp with time zone  NOT NULL,
  revoked_at timestamp with time zone,
  user_agent varchar(255),
  ip_address varchar(45),
  created_at timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_refresh_tokens         PRIMARY KEY (id),
  CONSTRAINT uq_refresh_tokens_token   UNIQUE (token_hash),
  CONSTRAINT fk_refresh_tokens_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens (usuario_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);

-- =====================================================
-- BOUNDED CONTEXT: catalog (fotos_pets)
-- pets foi criada na migration 0000_last_shotgun.sql
-- =====================================================

-- -----------------------------------------------------
-- Table fotos_pets
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fotos_pets (
  id         uuid                      NOT NULL DEFAULT gen_random_uuid(),
  pet_id     uuid                      NOT NULL,
  url        varchar(500)              NOT NULL,
  capa       boolean                   NOT NULL DEFAULT false,
  ordem      smallint                  NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  created_at timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_fotos_pets PRIMARY KEY (id),
  CONSTRAINT fk_fotos_pets FOREIGN KEY (pet_id)
    REFERENCES pets (id) ON DELETE CASCADE
);

CREATE INDEX idx_fotos_pets_pet ON fotos_pets (pet_id);

-- =====================================================
-- BOUNDED CONTEXT: match
-- =====================================================

-- -----------------------------------------------------
-- Table questionarios_match
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS questionarios_match (
  id                 uuid                      NOT NULL DEFAULT gen_random_uuid(),
  adotante_id        uuid                      NOT NULL, -- FK lógica → identity.adotantes.id
  tipo_moradia       tipo_moradia,
  disponibilidade    disponibilidade,
  experiencia_previa boolean                   NOT NULL DEFAULT false,
  tem_criancas       boolean                   NOT NULL DEFAULT false,
  tem_outros_pets    boolean                   NOT NULL DEFAULT false,
  observacoes        text,
  created_at         timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_questionarios_match    PRIMARY KEY (id),
  CONSTRAINT uq_questionarios_adotante UNIQUE (adotante_id)
);

-- =====================================================
-- BOUNDED CONTEXT: adoption
-- =====================================================
-- A tabela `adoption_requests` é criada na migration 0003_volatile_garia.sql.
-- A tabela `solicitacoes_adocao` (português) foi removida — o time substituiu
-- pela modelagem em inglês durante a feature de adoção.

-- =====================================================
-- BOUNDED CONTEXT: chat
-- =====================================================

-- -----------------------------------------------------
-- Table mensagens_chat
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS mensagens_chat (
  id             uuid                      NOT NULL DEFAULT gen_random_uuid(),
  solicitacao_id uuid                      NOT NULL, -- FK lógica → adoption.adoption_requests.id
  remetente_id   uuid                      NOT NULL, -- FK lógica → identity.usuarios.id
  conteudo       text                      NOT NULL,
  lida           boolean                   NOT NULL DEFAULT false,
  created_at     timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_mensagens_chat PRIMARY KEY (id)
);

CREATE INDEX idx_mensagens_solicitacao ON mensagens_chat (solicitacao_id);
CREATE INDEX idx_mensagens_remetente   ON mensagens_chat (remetente_id);

-- =====================================================
-- BOUNDED CONTEXT: geo
-- =====================================================

-- -----------------------------------------------------
-- Table feiras_adocao
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS feiras_adocao (
  id          uuid                      NOT NULL DEFAULT gen_random_uuid(),
  protetor_id uuid                      NOT NULL, -- FK lógica → identity.protetores_ongs.id
  titulo      varchar(150)              NOT NULL,
  descricao   text,
  endereco    varchar(255),
  data_inicio timestamp with time zone  NOT NULL,
  data_fim    timestamp with time zone  NOT NULL,
  created_at  timestamp with time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_feiras_adocao PRIMARY KEY (id)
);

CREATE INDEX idx_feiras_protetor ON feiras_adocao (protetor_id);
CREATE INDEX idx_feiras_data     ON feiras_adocao (data_inicio);

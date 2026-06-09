# AdotaPet — Backend Microserviços

Plataforma de adoção responsável de pets, construída com arquitetura de microserviços.

---

## Serviços

| Serviço | Porta | Responsabilidade |
|---------|-------|-----------------|
| `user-auth` | 4001 | Autenticação JWT, usuários, adotantes, protetores/ONGs |
| `catalog` | 4002 | Catálogo de pets disponíveis para adoção |
| `adoption` | 4003 | Solicitações e pipeline de adoção |
| `chat` | 4004 | Conversas entre adotantes e protetores |

---

## Stack

- **NestJS ^11** — framework
- **Drizzle ORM** — acesso ao banco
- **PostgreSQL 16** — banco de dados (1 instância, 4 databases)
- **RabbitMQ 3** — mensageria assíncrona entre serviços
- **JWT** — autenticação stateless com `permissions[]`
- **Biome** — lint e formatação

---

## Como executar

### Pré-requisitos

- Docker e Docker Compose instalados

### 1. Subir a infraestrutura completa

```bash
docker compose up -d
```

Isso sobe todos os 4 microserviços, PostgreSQL e RabbitMQ automaticamente.

### 2. Executar localmente (desenvolvimento)

Instale as dependências de cada serviço separadamente:

```bash
cd services/user-auth && npm install
cd services/catalog   && npm install
cd services/adoption  && npm install
cd services/chat      && npm install
```

Suba apenas a infraestrutura de suporte:

```bash
docker compose up postgres rabbitmq -d
```

Rode cada serviço em modo watch:

```bash
# Em terminais separados
cd services/user-auth && npm run start:dev
cd services/catalog   && npm run start:dev
cd services/adoption  && npm run start:dev
cd services/chat      && npm run start:dev
```

### 3. Migrations

```bash
cd services/<nome> && npm run db:migrate
```

---

## Variáveis de Ambiente

Cada serviço possui um `.env.example`. Copie e ajuste conforme necessário:

```bash
cp services/user-auth/.env.example services/user-auth/.env
cp services/catalog/.env.example   services/catalog/.env
cp services/adoption/.env.example  services/adoption/.env
cp services/chat/.env.example      services/chat/.env
```

### Variáveis obrigatórias por serviço

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta HTTP do serviço | `4001` |
| `JWT_SECRET` | Segredo para assinar/verificar JWT | `super-secret` |
| `DATABASE_URL` | Connection string do PostgreSQL | `postgres://postgres:postgres@localhost:5432/adotapet_identity` |
| `RABBITMQ_URL` | URL de conexão com RabbitMQ | `amqp://admin:admin@localhost:5672` |

> **Importante:** `JWT_SECRET` deve ser o mesmo em todos os serviços — cada um verifica o token independentemente.

---

## Documentação da API (Swagger)

Após subir os serviços, acesse:

| Serviço | URL |
|---------|-----|
| user-auth | http://localhost:4001/v1/docs |
| catalog | http://localhost:4002/v1/docs |
| adoption | http://localhost:4003/v1/docs |
| chat | http://localhost:4004/v1/docs |

---

## Comunicação entre Serviços

Os serviços **não se comunicam via HTTP**. Toda troca de dados é assíncrona via RabbitMQ:

```
user-auth  ──publishes──▶  identity.*.exchange  ──▶  adoption (consumer)
catalog    ──publishes──▶  catalog.pets.*.exchange ──▶  adoption (consumer)
adoption   ──publishes──▶  adoption.requests.*.exchange
chat       ──publica em logs/sem consumer direto
```

- **Publisher:** declara exchange no bootstrap e publica em cada write
- **Consumer:** canal dedicado, fila durável, `ack` no sucesso, `nack` sem re-queue no erro

---

## Alterações Realizadas

### Migração: Monolito → Microserviços

O projeto original (`backend_adotaPet`) era um monolito NestJS com todos os módulos em um único processo. A migração seguiu o padrão definido em `ARCHITECTURE.md`.

#### O que foi feito

**Monorepo e infraestrutura**
- Criado monorepo com `tsconfig.base.json`, `biome.json` e `docker-compose.yml` cobrindo todos os serviços + PostgreSQL + RabbitMQ
- `Dockerfile.service` genérico com `ARG SERVICE_NAME` reutilizado pelos 4 serviços
- Script SQL `docker/postgres/init/01-create-databases.sql` cria os 4 databases automaticamente no boot

**Módulo `shared/`**
- `SharedModule` com `@Global()` — provê `DrizzleService`, `RabbitMQService`, `SharedMessagingService`, interceptor HATEOAS e guards JWT globalmente para todos os serviços
- Guard JWT stateless: lê `permissions[]` do payload — sem Passport, sem sessão
- Decorators `@Public()`, `@RequirePermissions()`, `@CurrentUser()`
- Contratos de eventos RabbitMQ centralizados em `contracts/events/`

**Serviço `user-auth` (4001)**
- Módulos: `Usuarios`, `Adotantes`, `ProtetoresOngs`, `RefreshTokens`
- Entidades ricas: construtor privado, `create()` / `restore()`, getters, `withXxx()` fluent
- `auth.service.ts`: método privado `issueTokens()` compartilhado por login e refresh — corrige bug do refresh original que chamava login com senha vazia
- Publica eventos `identity.*` no RabbitMQ a cada write

**Serviço `catalog` (4002)**
- CRUD de pets com paginação (`findAllPaginated`)
- HATEOAS via `@HateoasList` / `@HateoasItem`
- Publica eventos `catalog.pets.*` (created, updated, deleted)

**Serviço `adoption` (4003)**
- Pipeline de solicitações de adoção com máquina de estados (`PENDING → APPROVED/REJECTED → COMPLETED`)
- Consumer RabbitMQ (`AdoptionMessageConsumerService`) sincroniza cópia local de pets via tabela `pets_local` — elimina dependência HTTP em tempo de execução
- `nack(msg, false, false)` em erros — evita loop infinito de reprocessamento

**Serviço `chat` (4004)**
- Módulos `Conversations` e `Messages`
- Controle de acesso por participante (adotante ou protetor da conversa)

**Testes**
- 16 suites de teste, 67 testes unitários — todos passando
- Corrigido `moduleNameMapper` (`@shared/*` apontava para path errado)
- Adicionado `moduleDirectories` nos serviços `catalog` e `adoption` para resolver `@nestjs/common` quando Jest carrega arquivos do `shared/` (que não tem `node_modules` próprio)

**Outros**
- `.gitignore` criado cobrindo `node_modules/`, `dist/`, `.env`, `coverage/`, `graphify-out/`
- `.dockerignore` criado — exclui `node_modules` locais do `COPY` para o Docker instalar binários nativos do Linux
- `.env.example` em cada serviço documentando as variáveis obrigatórias

---

### Correções aplicadas para o projeto subir

Problemas encontrados e corrigidos após a migração inicial:

**TypeScript / Build**

| Arquivo | Problema | Correção |
|---------|----------|----------|
| `shared/src/infra/messaging/rabbitmq.service.ts` | `amqplib.connect()` retorna `ChannelModel`, não `Connection` — métodos `createChannel()` e `close()` inexistentes no tipo declarado | Tipo trocado para `amqplib.ChannelModel` |
| `shared/src/infra/hateoas/hateoas.interceptor.ts` | `...item` com `item: unknown` — spread só aceita tipo objeto | Cast para `Record<string, unknown>` |
| `services/*/tsconfig.build.json` | `outDir: ./dist` herdado do `tsconfig.base.json` resolvia relativo à raiz do monorepo, não ao serviço — binários gerados em `backandintegrador/dist/` em vez de `services/<name>/dist/` | Adicionado `"outDir": "./dist"` explícito em cada `tsconfig.build.json` |
| `services/user-auth/.../adotantes.schema.ts` e `protetores-ongs.schema.ts` | Imports relativos com um nível `..` a menos — `../../../usuarios/...` levava a `adotantes/usuarios/` em vez de `identity/usuarios/` | Corrigido para `../../../../usuarios/...` |
| `services/user-auth/.../adotante.dto.ts` | `CreateAdotanteDto` usava `@Type(() => CreateAdotanteUsuarioDto)` com `emitDecoratorMetadata`, que emite `__metadata` imediatamente — mas a classe estava definida depois no mesmo arquivo | Movido `CreateAdotanteUsuarioDto` para antes de `CreateAdotanteDto` |

**Docker**

| Problema | Causa | Correção |
|----------|-------|----------|
| Binário `bcrypt_lib.node` não carregava no container | `node_modules` compilado para macOS era copiado para imagem Linux | Criado `.dockerignore` excluindo `**/node_modules` — npm instala fresh dentro do container |
| Migrations em loop infinito | Pasta `drizzle/` com arquivos `.sql` não existia | Executado `npx drizzle-kit generate` em cada serviço para gerar os arquivos de migração |

**Rotas — bugs descobertos ao testar os endpoints**

| Arquivo | Problema | Correção |
|---------|----------|----------|
| Todas as entidades — `Usuario`, `Adotante`, `Endereco`, `ProtetorOng`, `Pet`, `AdoptionRequest`, `Conversation`, `Message` | `static create()` não gerava UUID — `id` ficava `undefined` na entidade em memória | Adicionado `id: crypto.randomUUID()` em todos os `create()` |
| Todos os repositories Drizzle — `DrizzleUsuarioRepository`, `DrizzleAdotanteRepository`, `DrizzleProtetorOngRepository`, `DrizzlePetRepository`, `DrizzleAdoptionRequestRepository`, `DrizzleConversationRepository`, `DrizzleMessageRepository`, `DrizzleRefreshTokenRepository` | `insert().values({...})` não incluía o campo `id` — banco gerava UUID diferente do UUID da entidade, causando FK violation (`23503`) ao tentar referenciar o ID da entidade em inserts subsequentes | Adicionado `id: entity.id!` como primeiro campo em cada `.values()` |

---

## Estrutura do Monorepo

```
backandintegrador/
├── docker-compose.yml
├── Dockerfile.service          # imagem genérica (ARG SERVICE_NAME)
├── tsconfig.base.json
├── biome.json
├── package.json
├── docker/postgres/init/       # cria os 4 databases automaticamente
├── shared/src/                 # módulo compartilhado
│   ├── shared.module.ts
│   ├── domain/enums/           # Permission enum
│   ├── contracts/events/       # enums RabbitMQ
│   └── infra/                  # guards, hateoas, messaging, drizzle
└── services/
    ├── user-auth/
    ├── catalog/
    ├── adoption/
    └── chat/
```

# AdotaPet — Backend

Plataforma de adoção responsável de pets. Conecta ONGs e protetores independentes a adotantes por meio de cadastro de pets, sistema de match inteligente, chat integrado, gestão de solicitações de adoção e dashboard de relatórios.

## Arquitetura

Monorepo de microsserviços NestJS com Clean Architecture e DDD. Cada serviço possui banco de dados próprio (PostgreSQL) e se comunica de forma assíncrona via RabbitMQ.

```
├── shared/           # Módulo compartilhado (auth JWT, HATEOAS, RabbitMQ, DrizzleService, contratos de evento)
├── nginx/            # Gateway (reverse proxy) — roteia /v1/* para os 6 serviços
└── services/
    ├── user-auth/    # Porta 4001 — autenticação, cadastro de usuários, adotantes, protetores/ONGs
    ├── catalog/      # Porta 4002 — catálogo de pets (fotos, temperamento, porte)
    ├── adoption/     # Porta 4003 — pipeline de adoção (solicitações, aprovações)
    ├── chat/         # Porta 4004 — chat adotante ↔ protetor/ONG
    ├── match/        # Porta 4005 — questionário e match inteligente
    └── reports/      # Porta 4006 — dashboard de KPIs para ONGs e protetores
```

### Comunicação assíncrona (RabbitMQ)

Cada serviço publica eventos de domínio em *exchanges* `direct` duráveis. Os consumidores
mantêm **réplicas locais read-only** dos dados de que precisam (em vez de chamar outro
serviço via HTTP) — ex.: `profiles`, `adoption_pets`, `match_pets`, `report_*`. Os contratos
de evento (exchanges, routing keys e payloads tipados) ficam em `shared/src/contracts/events/`.

| Publicador | Eventos (routing key) | Consumidores |
|---|---|---|
| `user-auth` | `user.created`, `user.updated`, `user.deleted` | `catalog`, `adoption`, `chat` — réplica local de perfis (`profiles`) |
| `catalog` | `pet.created`, `pet.updated`, `pet.deleted` | `match` (réplica `match_pets` pra scoring), `adoption` (réplica `adoption_pets`), `reports` (`report_pets`) |
| `adoption` | `adoption-request.created`, `adoption-request.updated`, `adoption-request.deleted` | `chat` (abre conversa ao aprovar), `catalog` (marca pet como `adotado`), `reports` |
| `chat` | `conversation.created`, `message.created` | `reports` |

## Pré-requisitos

- Node.js 22+
- Docker e Docker Compose

## Subindo a infraestrutura

```bash
# Sobe PostgreSQL (6 bancos) + RabbitMQ
docker compose up -d
```

| Serviço | URL |
|---|---|
| PostgreSQL | `localhost:5432` |
| RabbitMQ | `localhost:5672` (AMQP) · `localhost:15672` (Management UI) |

Credenciais padrão RabbitMQ: `admin` / `admin`

## Variáveis de ambiente

Copie `.env.example` para `.env` na raiz de cada serviço:

```bash
cp services/user-auth/.env.example  services/user-auth/.env
cp services/catalog/.env.example    services/catalog/.env
cp services/adoption/.env.example   services/adoption/.env
cp services/chat/.env.example       services/chat/.env
cp services/match/.env.example      services/match/.env
cp services/reports/.env.example    services/reports/.env
```

### Variáveis comuns a todos os serviços

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta HTTP | ver tabela abaixo |
| `JWT_SECRET` | Chave para assinar/verificar tokens JWT | obrigatório |
| `DATABASE_URL` | Connection string PostgreSQL | ver tabela abaixo |
| `RABBITMQ_URL` | URL de conexão RabbitMQ | `amqp://admin:admin@localhost:5672` |

### Variáveis exclusivas do `user-auth`

| Variável | Descrição | Padrão |
|---|---|---|
| `JWT_ACCESS_EXPIRES_IN` | Expiração do access token | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token | `7d` |

### DATABASE_URL por serviço

| Serviço | Porta | DATABASE_URL padrão |
|---|---|---|
| user-auth | 4001 | `postgres://postgres:postgres@localhost:5432/adotapet_user_auth` |
| catalog | 4002 | `postgres://postgres:postgres@localhost:5432/adotapet_catalog` |
| adoption | 4003 | `postgres://postgres:postgres@localhost:5432/adotapet_adoption` |
| chat | 4004 | `postgres://postgres:postgres@localhost:5432/adotapet_chat` |
| match | 4005 | `postgres://postgres:postgres@localhost:5432/adotapet_match` |
| reports | 4006 | `postgres://postgres:postgres@localhost:5432/adotapet_reports` |

## Migrations

Cada serviço gerencia suas próprias migrations com Drizzle Kit. Nunca edite SQL à mão — edite o schema TypeScript e gere a migration.

```bash
# Dentro de cada serviço
npm run db:generate   # gera migration a partir dos schemas TS
npm run db:migrate    # aplica migrations pendentes
npm run db:check      # valida integridade do journal (rodado no CI)
npm run db:studio     # abre Drizzle Studio (UI)
```

> **Atenção:** apenas 1 PR com migration aberto por vez. Ver [CLAUDE.md](CLAUDE.md) para a política completa de migrations e como resolver conflitos de journal.

## Executando os serviços

### Desenvolvimento (modo watch)

```bash
cd services/user-auth && npm install && npm run dev   # :4001
cd services/catalog   && npm install && npm run dev   # :4002
cd services/adoption  && npm install && npm run dev   # :4003
cd services/chat      && npm install && npm run dev   # :4004
cd services/match     && npm install && npm run dev   # :4005
cd services/reports   && npm install && npm run dev   # :4006
```

### Build e produção

```bash
cd services/<nome>
npm run build
npm run start:prod
```

O Dockerfile genérico (`Dockerfile.service`) aceita `ARG SERVICE_NAME` e já executa `db:migrate` antes de subir o processo:

```bash
# Via docker compose (todos os serviços)
docker compose up --build
```

### Gateway e deploy de produção

Em produção um **gateway nginx** (`nginx/nginx.conf`) expõe uma única entrada e roteia por path
para os serviços internos:

| Path | Serviço |
|---|---|
| `/v1/users` | user-auth |
| `/v1/pets` | catalog |
| `/v1/adoptions` | adoption |
| `/v1/chat` | chat |
| `/v1/match` | match |
| `/v1/reports` | reports |

Pipeline de deploy (GitHub Actions):

1. Push em `main` → **CI** (`.github/workflows/ci.yml`) roda lint + build + `db:check` por serviço (matriz dos 6).
2. **`docker-publish.yml`** builda e publica as 6 imagens no **GHCR** (`ghcr.io/<owner>/backend_adotapet-<serviço>`).
3. **`deploy.yml`** dispara o webhook do **Easypanel** — só se o CI passou em `main`.
4. **`docker-compose.prod.yml`** puxa as imagens do GHCR; o gateway fica atrás do **Traefik** (TLS Let's Encrypt) e a API fica pública em `https://adotapet-api.upperlavtech.com/v1`.

## Testes

**23 suites · 186 testes unitários** cobrindo todos os serviços.

```bash
# Dentro de cada serviço
npm test              # roda uma vez (--runInBand --forceExit)
npm run test:watch    # modo watch
npm run test:cov      # com coverage
```

> Nunca rode os 6 serviços em paralelo — o ts-jest compila TypeScript em memória e pode esgotar RAM. Rode um de cada vez.

| Serviço | Suites | Testes |
|---|---|---|
| user-auth | 8 | 57 |
| catalog | 2 | 20 |
| adoption | 2 | 19 |
| chat | 4 | 31 |
| match | 4 | 29 |
| reports | 3 | 30 |
| **Total** | **23** | **186** |

Documentação completa dos testes: [docs/TESTS.md](docs/TESTS.md)

## Documentação da API (Swagger)

Após subir os serviços, acesse:

| Serviço | URL Swagger |
|---|---|
| user-auth | http://localhost:4001/v1/docs |
| catalog | http://localhost:4002/v1/docs |
| adoption | http://localhost:4003/v1/docs |
| chat | http://localhost:4004/v1/docs |
| match | http://localhost:4005/v1/docs |
| reports | http://localhost:4006/v1/docs |

Todas as rotas usam prefixo `/v1`. Rotas protegidas exigem Bearer token JWT obtido em `POST /v1/auth/login` (user-auth).

## Scripts disponíveis (por serviço)

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia em modo watch |
| `npm run build` | Compila com `nest build` + resolve path aliases |
| `npm run start:prod` | Sobe o build compilado |
| `npm run db:generate` | Gera migration a partir dos schemas TS |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:check` | Valida integridade do journal |
| `npm run db:studio` | Abre Drizzle Studio |
| `npm test` | Roda testes unitários |
| `npm run test:cov` | Testes com coverage |
| `npm run typecheck` | Verifica tipos sem emitir |
| `npm run lint` | Lint com Biome |
| `npm run check` | Lint + format check com Biome |

## Stack

- **NestJS 11** — framework Node.js
- **Drizzle ORM** — ORM type-safe para PostgreSQL
- **PostgreSQL 16** — banco de dados (1 instância, 6 bancos separados)
- **RabbitMQ 3** — mensageria assíncrona entre serviços
- **TypeScript 5** — linguagem principal
- **JWT** — access token + refresh token stateless
- **HATEOAS** — links de navegação nas respostas de API
- **Swagger/OpenAPI** — documentação automática em `/v1/docs`
- **Biome** — lint e formatação
- **Jest + ts-jest** — testes unitários

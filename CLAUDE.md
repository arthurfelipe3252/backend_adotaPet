# AdotaPet Backend

Plataforma de adoção responsável de pets. **Monorepo de microsserviços NestJS** com Clean Architecture + DDD. Cada serviço é um bounded context isolado, com **banco PostgreSQL próprio**, comunicando-se de forma **assíncrona via RabbitMQ**. Um pacote `shared/` provê o que é transversal (auth JWT, HATEOAS, mensageria, DrizzleService, contratos de evento).

> Visão geral de execução, portas, eventos e deploy: ver [README.md](README.md). Este arquivo foca em **arquitetura e convenções de código**.

## Stack

- **NestJS 11** (framework)
- **Drizzle ORM** (banco de dados, type-safe)
- **PostgreSQL 16** (1 instância, **6 bancos** separados — um por serviço)
- **RabbitMQ 3** (mensageria assíncrona entre serviços — direct exchanges duráveis)
- **TypeScript 5** com `module: commonjs` (ver `tsconfig.base.json`)
- **JWT** (access + refresh), **HATEOAS**, **Swagger** (`/v1/docs`), **Biome** (lint), **Jest** (testes)

## Comandos

Comandos de banco/build/test rodam **por serviço** (`cd services/<serviço>`):

```bash
npm run dev              # Inicia o serviço em modo watch
npm run build            # nest build + tsc-alias (resolve path aliases)
npm run start:prod       # Sobe o build compilado
npm run db:generate      # Gera migration a partir dos schemas TS do serviço
npm run db:migrate       # Aplica migrations pendentes (drizzle-kit migrate)
npm run db:check         # Valida integridade do journal (rodado no CI)
npm run db:studio        # Abre Drizzle Studio (UI)
npm test                 # Testes unitários (jest --runInBand --forceExit)
npm run lint             # Lint com Biome
```

Infra (na raiz do repo):

```bash
docker compose up -d     # Sobe PostgreSQL (cria os 6 bancos) + RabbitMQ
docker compose up --build  # Sobe os 6 serviços + infra (Dockerfile.service genérico)
```

> `db:push` **não deve ser usado** — sincroniza o schema direto no banco sem gerar migration, quebrando o controle de versões. Use sempre o fluxo `db:generate` → `db:migrate`. Ver seção **Migrations**.

## Arquitetura

Monorepo de microsserviços — cada bounded context é um **serviço NestJS independente** em `services/<serviço>/`, com banco próprio. A comunicação entre serviços é feita **via eventos (RabbitMQ)**, nunca por imports diretos de classes de outro serviço nem por queries no banco de outro. Quando um serviço precisa de dado de outro contexto, ele mantém uma **réplica local read-only** alimentada por evento (ex.: `profiles`, `adoption_pets`, `match_pets`, `report_*`) — extração já consumada, não mais "preparação".

### Estrutura de pastas

```
.
├── shared/                          ← pacote compartilhado (importado por todos os serviços)
│   └── src/
│       ├── shared.module.ts         ← @Global: auth, DrizzleService, RabbitMQ, HATEOAS, health
│       ├── contracts/events/        ← exchanges, routing keys e payloads tipados dos eventos
│       └── infra/                   ← auth (JWT/permissions), database, messaging, http, hateoas
├── nginx/                           ← gateway (reverse proxy) — roteia /v1/* p/ os serviços
├── docker-compose.yml               ← Postgres (6 bancos) + RabbitMQ (dev)
├── docker-compose.prod.yml          ← imagens GHCR + gateway atrás do Traefik (Easypanel)
└── services/
    └── <serviço>/                   ← microsserviço (banco e porta próprios)
        ├── drizzle.config.ts        ← glob dos schemas do serviço
        ├── drizzle/                 ← migrations geradas (por serviço)
        └── src/
            ├── app.module.ts        ← importa ConfigModule + SharedModule + módulos do serviço
            ├── main.ts              ← bootstrapHttpApp(AppModule, { title, prefix: 'v1' })
            └── modules/
                └── <contexto>/
                    └── <entidade>/
                        ├── domain/
                        │   ├── models/<entidade>.entity.ts
                        │   └── repositories/<entidade>-repository.interface.ts
                        ├── application/
                        │   ├── dto/<entidade>.dto.ts
                        │   └── services/<entidade>.service.ts
                        └── infra/
                            ├── schemas/<entidade>.schema.ts
                            ├── repositories/drizzle-<entidade>.repository.ts
                            ├── controllers/<entidades>.controller.ts
                            └── consumers/<evento>-consumer.service.ts   ← consumidores RabbitMQ
```

### Bounded Contexts (serviços)

| Serviço | Porta | Alias | Tipo | Descrição |
|---|---|---|---|---|
| `user-auth` | 4001 | `@identity` | Generic | Autenticação, registro (adotantes, protetores/ONGs), JWT, LGPD |
| `catalog` | 4002 | `@catalog` | Supporting | Catálogo de pets (fotos, temperamento, porte) |
| `adoption` | 4003 | `@adoption` | Core | Pipeline de adoção (solicitações, aprovações, pré-triagem) |
| `chat` | 4004 | `@chat` | Supporting | Chat integrado adotante ↔ protetor/ONG |
| `match` | 4005 | `@match` | Core | Questionário + match inteligente por estilo de vida |
| `reports` | 4006 | `@reports` | Supporting | Dashboard de KPIs/métricas (read-model via eventos) |

> Os bounded contexts `timeline`, `geo`, `notifications` e `payments` foram planejados mas **ainda não implementados** como serviços.

### Path aliases

Cada serviço define em seu `tsconfig.json`: `@shared/*` (pacote compartilhado) + um alias próprio para seus módulos. Sempre use aliases nos imports:

```typescript
// Correto (ex.: dentro do serviço catalog)
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Pet } from "@catalog/pets/domain/models/pet.entity";

// Errado — nunca use caminhos relativos longos entre módulos
import { Pet } from "../../../catalog/pets/domain/models/pet.entity";
```

## Convenções de código

### Nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Entidade de domínio | PascalCase | `Pet` |
| DTO | PascalCase + Dto | `PetDto` |
| Service | PascalCase + Service | `PetService` |
| Controller | PascalCase plural + Controller | `PetsController` |
| Interface de repositório | PascalCase + Repository | `PetRepository` |
| Implementação do repositório | Drizzle + PascalCase + Repository | `DrizzlePetRepository` |
| Token de DI | UPPER_SNAKE_CASE | `PET_REPOSITORY` |
| Schema Drizzle (variável) | camelCase plural + Schema | `petsSchema` |
| Tabela no banco | snake_case plural | `pets` |
| Coluna no banco | snake_case | `created_at` |
| Arquivo | kebab-case.tipo.ts | `pet.entity.ts`, `pets.controller.ts` |
| Módulo NestJS | PascalCase + Module | `PetsModule` |

### Entidade de domínio

Classe rica com campos privados, getters, builders (`with<Prop>`) e factory estático `restore()`:

```typescript
export class Pet {
  private readonly _id?: string;
  private _name: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) { ... }

  get id(): string | undefined { return this._id; }
  get name(): string { return this._name; }

  withName(name: string) { this._name = name; return this; }

  static restore(props?: { ... }): Pet | null {
    if (!props) return null;
    const entity = new Pet(props.id, props.createdAt, props.updatedAt);
    entity._name = props.name;
    return entity;
  }
}
```

### DTO

DTOs de **entrada** (body de POST/PATCH) são **classes** com `class-validator` + `@nestjs/swagger`, não interfaces — assim o `ValidationPipe` global rejeita input inválido com **400** (interface não tem metadata em runtime → 500). Union types de string usam `@IsEnum([...])` com array literal:

```typescript
const ESPECIES = ['cao', 'gato', 'outro'] as const;

export class CreatePetDto {
  @ApiProperty({ example: 'Rex', maxLength: 100 })
  @IsString() @IsNotEmpty() @MaxLength(100)
  nome!: string;

  @ApiProperty({ enum: ESPECIES })
  @IsEnum(ESPECIES)
  especie!: Especie;

  @ApiPropertyOptional() @IsOptional() @IsString()
  descricao?: string | null;
}
```

DTOs de **resposta** (`PetResponseDto`) podem ser `interface` — não passam pelo `ValidationPipe`. Decore **todos** os campos de entrada: o `ValidationPipe` usa `whitelist: true` e descarta props não decoradas.

### Interface de repositório

Define o contrato no domínio com Symbol para injeção de dependência:

```typescript
export const PET_REPOSITORY = Symbol("PET_REPOSITORY");

export interface PetRepository {
  create(pet: Pet): Promise<void>;
  update(pet: Pet): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Pet[]>;
  findById(id: string): Promise<Pet | null>;
}
```

### Registro no módulo

Usa `useExisting` para vincular a interface ao repositório concreto. Cada módulo importa apenas `SharedModule` e suas próprias dependências:

```typescript
@Module({
  imports: [SharedModule],
  controllers: [PetsController],
  providers: [
    PetService,
    DrizzlePetRepository,
    {
      provide: PET_REPOSITORY,
      useExisting: DrizzlePetRepository,
    },
  ],
})
export class PetsModule {}
```

### Schema Drizzle

Toda tabela tem `id` (uuid), `createdAt` e `updatedAt`:

```typescript
export const petsSchema = pgTable("pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
```

Mapeamento de tipos:
- `string` → `text()` ou `varchar({ length: N })`
- `number` inteiro → `integer()`
- `number` decimal → `numeric({ precision, scale })`
- `boolean` → `boolean().default(false)`
- `Date` → `timestamp({ withTimezone: true })`
- Nullable → remover `.notNull()`

### DrizzleService

Serviço global em `shared/src/infra/database/drizzle.service.ts` — cria um `Pool` `pg` a partir do `DATABASE_URL` do serviço e expõe `db`. É compartilhado entre os 6 serviços; **não** agrega um objeto `schema` central (cada serviço glob-eia seus próprios schemas via `drizzle.config.ts`). Use `this.drizzle.db` no repositório, importando o `petsSchema` diretamente.

### Database

- Cada serviço usa seu **próprio** `DATABASE_URL` (banco `adotapet_<serviço>`), não campos separados
- Migrations ficam em `services/<serviço>/drizzle/`
- Config em `services/<serviço>/drizzle.config.ts` com glob `./src/modules/**/infra/schemas/*.ts`

## Migrations

Source-of-truth são os **schemas TypeScript** (`src/modules/**/infra/schemas/*.ts`) de cada serviço. As migrations SQL são **geradas pelo drizzle-kit** — não escrevemos SQL à mão.

### Workflow para mudar o banco (dentro de `services/<serviço>/`)

1. Editar o `*.schema.ts` correspondente
2. Rodar `npm run db:generate` → cria novo arquivo `NNNN_xxx.sql` em `services/<serviço>/drizzle/` + atualiza `meta/_journal.json`
3. **Revisar o SQL gerado** — drizzle às vezes inclui DROPs ou ALTERs inesperados
4. Aplicar localmente: `npm run db:migrate`
5. Commit do schema TS + arquivo SQL + meta/ junto
6. Em produção, o entrypoint do container roda `drizzle-kit migrate` automaticamente antes do `start:prod`

### Política de PR (CRÍTICO — evita corrupção do journal)

- **1 PR com migration por serviço aberto por vez.** Cada serviço tem seu próprio `_journal.json`; o conflito só acontece dentro do mesmo serviço, mas a regra evita o cenário de merge paralelo.
- Em caso de conflito no `_journal.json` durante rebase/merge:
  1. Deletar `meta/_journal.json` e `meta/*_snapshot.json` do serviço
  2. Deletar todos os arquivos `*.sql` adicionados pelo seu branch nesse serviço
  3. Rodar `npm run db:generate` de novo a partir do main atualizado
  4. Commitar a regeração
- CI roda `npm run db:check` por serviço em todo PR — falha se o journal estiver inconsistente

### Histórico

Antes da migração para microsserviços (monolito, maio/2026), o journal foi corrompido por merges paralelos de PRs que rodaram `db:generate` em branches diferentes — gerando `idx` duplicados e migrations duplicadas. Foi resolvido por **reset baseline** (uma única `0000`). Já no micro, o `catalog` teve um caso análogo (entry fantasma `0001_cool_hairball` sem `.sql`/snapshot, R3) — resolvido removendo a entry; hoje cada serviço migra do zero pelo fluxo normal.

### Bootstrap em ambientes pré-existentes

Se um ambiente já tem o schema aplicado mas a tabela `drizzle.__drizzle_migrations` está vazia/desatualizada, registre manualmente as migrations já aplicadas para o `drizzle-kit migrate` não tentar reaplicá-las:

```bash
# Local (extrai hashes do journal)
npx ts-node ./scripts/print-migration-hashes.ts
```

Execute o `INSERT ... ON CONFLICT DO NOTHING` impresso na tabela `drizzle.__drizzle_migrations` do ambiente alvo.

### Tabelas legacy fora do controle do Drizzle

O banco **legado do monolito** (`adotapet_prod`) tem 3 tabelas sem schema TS correspondente: `fotos_pets`, `mensagens_chat`, `feiras_adocao` (confirmadas existindo). Os microsserviços usam bancos próprios (`adotapet_<serviço>`) e não as enxergam. Decisão futura (não agora): assumir como ativas (criar schemas) ou dropá-las.

## Regras de desacoplamento

1. **Nunca** importe classes concretas de outro serviço diretamente
2. **Nunca** faça queries SQL acessando o banco de outro serviço
3. Comunicação entre serviços: **via eventos RabbitMQ** (contratos em `shared/src/contracts/events/`) ou réplicas locais alimentadas por evento
4. Cada módulo importa apenas `SharedModule` e suas próprias dependências
5. O `AppModule` de cada serviço importa só os módulos daquele serviço

## Scaffold de módulos

Use o comando `/create-module` para criar novos módulos (dentro de um serviço) seguindo todos os padrões acima. O comando guia passo a passo: nome, se é submódulo, entidades e propriedades.

# AdotaPet Backend

Plataforma de adoção responsável de pets. Monolito modular NestJS com Clean Architecture + DDD, preparado para extração futura em microsserviços.

## Stack

- **NestJS** (framework)
- **Drizzle ORM** (banco de dados)
- **PostgreSQL 16** (database)
- **RabbitMQ 3** (mensageria — preparação para microsserviços)
- **TypeScript** com `module: nodenext`

## Comandos

```bash
npm run dev              # Inicia em modo watch
npm run build            # Compila o projeto
npm run db:generate      # Gera migrations a partir dos schemas
npm run db:migrate       # Aplica migrations pendentes
npm run db:push          # Sincroniza schema direto (dev only)
npm run db:studio        # Abre Drizzle Studio (UI)
docker compose up -d     # Sobe PostgreSQL + RabbitMQ
```

## Arquitetura

Monolito modular — cada bounded context é um módulo NestJS isolado dentro de `src/modules/`. A comunicação entre módulos deve ser feita via interfaces/eventos, nunca por imports diretos de classes concretas de outro módulo. Isso garante que a extração para microsserviço seja uma mudança de infraestrutura, não de lógica.

### Estrutura de pastas

```
src/
├── app.module.ts
├── main.ts
├── shared/
│   ├── shared.module.ts
│   └── infra/
│       └── database/
│           ├── drizzle.service.ts
│           └── drizzle/          ← migrations geradas aqui
└── modules/
    └── <modulo>/                 ← bounded context
        ├── <modulo>.module.ts    ← módulo agregador (se tiver submódulos)
        └── <entidade>/
            ├── <entidade>.module.ts
            ├── domain/
            │   ├── models/<entidade>.entity.ts
            │   └── repositories/<entidade>-repository.interface.ts
            ├── application/
            │   ├── dto/<entidade>.dto.ts
            │   └── services/<entidade>.service.ts
            └── infra/
                ├── schemas/<entidade>.schema.ts
                ├── repositories/drizzle-<entidade>.repository.ts
                └── controllers/<entidades>.controller.ts
```

### Bounded Contexts (módulos)

| Alias | Módulo | Tipo | Descrição |
|---|---|---|---|
| `@identity` | identity | Generic | Autenticação, registro, LGPD |
| `@catalog` | catalog | Supporting | Catálogo de pets (fotos, temperamento, porte) |
| `@match` | match | Core | Match inteligente + triagem por estilo de vida |
| `@adoption` | adoption | Core | Pipeline de adoção (solicitações, aprovações) |
| `@chat` | chat | Supporting | Chat integrado adotante ↔ protetor/ONG |
| `@timeline` | timeline | Supporting | Fotos e atualizações pós-adoção |
| `@geo` | geo | Generic | Mapa de feiras e pontos de adoção |
| `@notifications` | notifications | Generic | Push e email |
| `@payments` | payments | Generic | Mensalidade ONGs, doações |

### Path aliases

Definidos em `tsconfig.json`. Sempre use aliases nos imports:
```typescript
// Correto
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Pet } from "@catalog/pets/domain/models/pet.entity";

// Errado — nunca use caminhos relativos entre módulos
import { Pet } from "../../catalog/pets/domain/models/pet.entity";
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

Usa `useExisting` para vincular a interface ao repositório concreto:

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

Serviço global em `src/shared/infra/database/drizzle.service.ts`. Ao criar novos schemas, importe e adicione ao objeto `schema` neste arquivo.

### Database

- Usa `DATABASE_URL` como connection string (não campos separados)
- Migrations ficam em `src/shared/infra/database/drizzle/`
- Config em `drizzle.config.ts` com glob `./src/modules/**/infra/schemas/*.ts`

## Regras de desacoplamento

1. **Nunca** importe classes concretas de outro módulo diretamente
2. **Nunca** faça queries SQL de um módulo acessando tabelas de outro
3. Comunicação entre módulos: via interfaces exportadas ou eventos (RabbitMQ no futuro)
4. Cada módulo importa apenas `SharedModule` e suas próprias dependências
5. O `AppModule` é o único que importa todos os módulos

## Scaffold de módulos

Use o comando `/create-module` para criar novos módulos seguindo todos os padrões acima. O comando guia passo a passo: nome, se é submódulo, entidades e propriedades.

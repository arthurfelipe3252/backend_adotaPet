# Testes — AdotaPet Backend

**23 suites · 183 testes · 6 serviços**

Todos os testes são unitários com instanciação direta de classes (`new Service(mockDep)`). Sem `Test.createTestingModule` — mais rápido, sem overhead do container NestJS.

## Como rodar

```bash
# Dentro de cada serviço
npm test                  # roda uma vez
npm run test:watch        # modo watch
npm run test:cov          # com coverage

# Flags usadas em todos os scripts
jest --runInBand --forceExit   # serializado (não paralelo) — evita OOM
```

> **Atenção:** nunca rode os 6 serviços em paralelo (`&` / background simultâneo). O ts-jest compila TypeScript em memória; 6 em paralelo esgota RAM.

---

## Infraestrutura

### `jest.config.js` (cada serviço)

| Opção | Valor | Por quê |
|---|---|---|
| `isolatedModules: true` | ts-jest | Ignora type-check de imports de `../../shared/src/` cujos tipos não resolvem de dentro do serviço |
| `moduleNameMapper` | mapeia `@nestjs/*`, `drizzle-orm/*`, `pg`, etc. | Arquivos em `shared/src/` sobem pelo diretório e não acham `node_modules` do serviço |
| `--runInBand` | script npm | Serializa workers; sem isso o ts-jest pode consumir 30 GB+ |

### Mocks de módulos ESM

`drizzle-orm/node-postgres` e `drizzle-orm/pg-core` usam `export` ESM — incompatível com Jest CommonJS. Cada serviço tem:

```
services/<serviço>/__mocks__/
  drizzle-orm-node-postgres.js   # mock do drizzle() — todos os serviços
  drizzle-orm-pg-core.js         # mock de pgTable/uuid/text/… — só reports
```

---

## Padrões dos testes

### Services

```typescript
// Repositório mockado
const repo = {
  findById: jest.fn(),
  create: jest.fn(),
  // ...
};

// Instanciação direta
const service = new MyService(repo as any);

// Teste
repo.findById.mockResolvedValue(null);
await expect(service.doSomething('id')).rejects.toThrow(NotFoundException);
```

### Controllers

Verificam apenas **delegação** — o controller deve repassar os argumentos certos ao service:

```typescript
const controller = new MyController(service as any);
await controller.create(dto, mockRequest);
expect(service.create).toHaveBeenCalledWith(expectedArgs);
```

### Serviços com transação (`DrizzleService.db.transaction`)

```typescript
const drizzle = {
  db: {
    transaction: jest.fn().mockImplementation(async (fn) => fn({})),
  },
};
const service = new AdotanteService(repo as any, drizzle as any);
```

---

## Serviços

### user-auth — 8 suites · 57 testes

Serviço de autenticação e identidade (JWT, refresh tokens, perfis de adotante/protetor/ONG).

> **Nota:** entidades `Usuario`, `Adotante`, `Protetor` usam `restaurar()` (português). `RefreshToken` usa `restore()` (inglês).

#### `auth.service.spec.ts` — 13 testes

| Grupo | Testes |
|---|---|
| `login` | email não encontrado · usuário inativo · senha errada · retorna access+refresh tokens |
| `refresh` | token não encontrado · token expirado · usuário não encontrado · rotaciona tokens |
| `logout` | revoga token quando encontrado · idempotente quando não encontrado |
| `logoutAll` | revoga todos os tokens do usuário |

#### `usuario.service.spec.ts` — 14 testes

| Grupo | Testes |
|---|---|
| `buscarPorId` | ForbiddenException para outro usuário · NotFoundException quando não existe · retorna quando autorizado |
| `buscarPerfilProprio` | retorna sem checar autorização · NotFoundException quando inativo |
| `atualizar` | ForbiddenException para outro usuário · atualiza e retorna |
| `alterarSenha` | UnauthorizedException com senha errada · atualiza hash |
| `desativar` | ForbiddenException · NotFoundException · desativa e revoga todos os tokens |

#### `adotante.service.spec.ts` — 9 testes

| Grupo | Testes |
|---|---|
| `criar` | ConflictException e-mail duplicado · ConflictException CPF duplicado · criação atômica (transação) |
| `buscarMeuPerfil` | ForbiddenException para não-adotante · NotFoundException · retorna perfil completo |
| `atualizarMeuPerfil` | ForbiddenException · NotFoundException · atualiza perfil |

#### `protetor-ong.service.spec.ts` — 11 testes

| Grupo | Testes |
|---|---|
| `criar` | ConflictException e-mail · ConflictException CPF/CNPJ · criação atômica |
| `buscarMeuPerfil` | ForbiddenException para adotante · NotFoundException · retorna protetor · retorna ONG |
| `atualizarMeuPerfil` | ForbiddenException · NotFoundException · atualiza |

#### `auth.controller.spec.ts` — 4 testes

Verifica que `login` extrai `userAgent` e `ipAddress` do request antes de delegar; `refresh`, `logout`, `logoutAll` delegam diretamente.

#### `usuarios.controller.spec.ts` — 5 testes

Cada endpoint delega com os parâmetros certos (`autenticado.id`, `id`, `dto`).

#### `adotantes.controller.spec.ts` — 3 testes

`criar`, `buscarMe`, `atualizarMe` delegam ao service passando `id` e `tipoUsuario` do JWT.

#### `protetores-ongs.controller.spec.ts` — 3 testes

Mesmo padrão de delegação do controller de adotantes.

---

### catalog — 2 suites · 20 testes

Catálogo de pets com ownership check e publicação de eventos.

#### `pet.service.spec.ts` — 14 testes

| Grupo | Testes |
|---|---|
| `create` | cria e publica evento `pet.created` |
| `findAll` | retorna lista mapeada · repassa filtros ao repositório |
| `findById` | retorna quando existe · NotFoundException |
| `findByProtetor` | retorna pets do protetor |
| `update` | NotFoundException · ForbiddenException (não é dono) · atualiza e publica `pet.updated` |
| `delete` | NotFoundException · ForbiddenException (não é dono) · deleta e publica `pet.deleted` |

#### `pets.controller.spec.ts` — 6 testes

Foco em `findAll`: converte query string `castrado` para boolean/undefined. Os demais endpoints delegam diretamente.

---

### adoption — 2 suites · 19 testes

Pipeline de solicitações de adoção com autorização por papel.

#### `adoption-request.service.spec.ts` — 14 testes

| Grupo | Testes |
|---|---|
| `create` | cria e publica `adoption.created` |
| `findAll` | filtra por `adopterId` para adotante · filtra por `protetorId` para protetor |
| `findById` | NotFoundException · ForbiddenException adotante vendo outro · ForbiddenException protetor vendo outro · retorna para próprio adotante · retorna para próprio protetor |
| `updateStatus` | NotFoundException · ForbiddenException outro protetor · atualiza e publica `adoption.updated` |
| `delete` | NotFoundException · ForbiddenException outro adotante · deleta própria solicitação |

#### `adoption-requests.controller.spec.ts` — 5 testes

Delegação direta para todos os 5 endpoints (`create`, `findAll`, `findById`, `updateStatus`, `delete`).

---

### chat — 4 suites · 28 testes

Chat entre adotante e protetor com conversas e mensagens.

#### `conversation.service.spec.ts` — 15 testes

| Grupo | Testes |
|---|---|
| `create` | idempotente (retorna existente quando `adoptionRequestId` já tem conversa) · cria nova e publica evento |
| `createInternal` | pula se conversa já existe · cria e publica (usado pelo consumer) |
| `findAll` | filtra por `adopterId` para adotante · por `protetorId` para protetor |
| `findById` | NotFoundException · ForbiddenException não-participante · retorna para adotante · retorna para protetor |
| `updateStatus` | NotFoundException · ForbiddenException · atualiza `isActive` |

#### `message.service.spec.ts` — 8 testes

| Testes |
|---|
| NotFoundException quando conversa não existe |
| ForbiddenException quando remetente não é participante |
| adotante cria mensagem e atualiza conversa |
| protetor também pode criar mensagem |
| lista mensagens por conversa |
| NotFoundException ao listar mensagens de conversa inexistente |
| atualiza status de leitura (`readAt`) |
| NotFoundException ao atualizar mensagem inexistente |

#### `conversations.controller.spec.ts` — 4 testes

Delegação: `create`, `findAll`, `findById`, `updateStatus`.

#### `messages.controller.spec.ts` — 3 testes

Delegação: `create` (com `conversationId`), `findByConversation`, `updateReadStatus`.

---

### match — 4 suites · 29 testes

Sistema de match inteligente entre perfil do adotante e pets disponíveis.

#### `match-scoring.service.spec.ts` — 7 testes

Testa a lógica de score puro (sem I/O):

| Testes |
|---|
| score sempre entre 0 e 100 |
| gatos pontuam alto independente de moradia (adaptam-se a apartamento) |
| cão grande pontua menos em apartamento sem área de lazer |
| perfil companheiro aumenta score quando `temperamento` bate |
| temperamento instável + crianças pequenas reduz score |
| usuário que viaja frequentemente + cão dependente reduz score |
| score retorna inteiro (arredondado) |

#### `questionario-match.service.spec.ts` — 12 testes

| Grupo | Testes |
|---|---|
| `salvar` | faz upsert e retorna questionário |
| `buscarMeu` | retorna próprio questionário · NotFoundException quando não existe |
| `buscarPorAdotante` | ForbiddenException para outro usuário · retorna quando IDs batem |
| `calcularMeuMatch` | NotFoundException sem questionário · rankeia pets disponíveis da réplica local |
| `calcularMatch` | ForbiddenException para outro usuário · calcula match próprio · ordena resultados por score desc |
| `remover` | NotFoundException quando não existe · deleta questionário |

#### `questionario-match.controller.spec.ts` — 6 testes

Delegação: `salvar`, `buscarMeu`, `buscarPorAdotante`, `calcularMeuMatch`, `calcularMatch`, `remover`.

#### `catalog-pet-consumer.service.spec.ts` — 4 testes

Consumidor da réplica local de pets (eventos do catalog via RabbitMQ):

| Testes |
|---|
| registra os 3 consumidores nas exchanges do catalog |
| `pet.created` → upsert na réplica `match_pets` |
| `pet.updated` → upsert na réplica |
| `pet.deleted` → remove da réplica |

---

### reports — 3 suites · 30 testes

Dashboard de KPIs para ONGs e protetores, alimentado por eventos via RabbitMQ.

#### `dashboard.service.spec.ts` — 14 testes

| Grupo | Testes |
|---|---|
| `resolveProtetorId` | ForbiddenException para adotante · retorna userId para protetor · retorna userId para ONG |
| `getKpis` | agrega dados de todos os ports · `taxaConversao` é `null` quando `totalRequests = 0` |
| `getAdoptionsTimeline` | preenche lacunas de meses e retorna contagem correta |
| `getRequestsTimeline` | preenche lacunas de meses |
| `getFunnel` | retorna contagens por status como funil |
| `getTopPets` | enriquece top pets com detalhes do pet · retorna array vazio quando sem dados |
| `getStalePets` | calcula `diasNoCatalogo` para cada pet parado |
| `getDashboard` | agrega todas as seções em paralelo |

#### `reports-consumer.service.spec.ts` — 9 testes

Testa o consumer RabbitMQ que atualiza tabelas de relatório:

| Grupo | Testes |
|---|---|
| `onApplicationBootstrap` | registra exatamente 7 consumers · registra todas as filas requeridas |
| `pet-created` | insere em `report_pets` |
| `pet-updated` | atualiza `report_pets` |
| `pet-deleted` | deleta de `report_pets` |
| `adoption-created` | insere em `report_adoption_requests` |
| `adoption-updated` | atualiza `report_adoption_requests` |
| `conversation-created` | insere em `report_conversations` |
| `message-created` | insere em `report_messages` |

#### `reports.controller.spec.ts` — 7 testes

Verifica que todos os endpoints chamam `resolveProtetorId` antes de delegar; testa defaults de query params (`months=12`, `limit=5`, `days=30`).

---

## Resumo por serviço

| Serviço | Suites | Testes | Arquivo de config |
|---|---|---|---|
| user-auth | 8 | 57 | [jest.config.js](../services/user-auth/jest.config.js) |
| catalog | 2 | 20 | [jest.config.js](../services/catalog/jest.config.js) |
| adoption | 2 | 19 | [jest.config.js](../services/adoption/jest.config.js) |
| chat | 4 | 28 | [jest.config.js](../services/chat/jest.config.js) |
| match | 4 | 29 | [jest.config.js](../services/match/jest.config.js) |
| reports | 3 | 30 | [jest.config.js](../services/reports/jest.config.js) |
| **Total** | **23** | **183** | |

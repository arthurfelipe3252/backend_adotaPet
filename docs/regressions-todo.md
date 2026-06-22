# Regressões da migração monolito → microsserviços (a corrigir)

Descobertas no teste comparativo de 2026-06-14 (ver `migration-behavior-comparison.md`).
Causa comum das #1 e #2: **dependência de dado entre bounded contexts foi cortada na migração e
não recriada via evento/réplica** — a mesma classe do "match stub" (já corrigido nesta sessão).

> **Status (2026-06-14): R1–R8 todas RESOLVIDAS e re-testadas no E2E.** Aprovar/rejeitar/ver adoção
> → 200; conversa auto-criada ao aprovar + mensagens; `:adotanteId` voltou a ser id de perfil; rota
> `/read` exposta; eventos de adoção chegam ao reports; paginação real; resumos de perfil
> (`protetor`/`adopter`/`sender`) populados via réplica de evento. Diferenças de corpo remanescentes
> vs monolito: só **HATEOAS aditivo** (envelope da listagem + `_links`). Detalhes por regressão abaixo.

---

## ✅ R1 (RESOLVIDO) — Aprovação de adoção retorna 403

- **Sintoma:** **toda** operação de adoção com checagem de posse falha no micro com **403**
  "Solicitação pertence a outro protetor/ong" (monolito: 200) — confirmado em
  `PATCH /adoptions/{id}/status` (approve **e** reject) **e** `GET /adoptions/{id}`.
- **Causa:** `POST /v1/adoptions` grava `protetor_id` **vazio**, porque o serviço `adoption` não
  tem acesso aos pets (banco do `catalog`) nem consome evento de pet. A checagem de posse na
  aprovação (`adoption.protetorId === user.sub`) então falha.
- **Evidência:** `adoption_requests.protetor_id = ''` enquanto `pets.protetor_id = <protetor>`.
- **Fix proposto (análogo ao match):** o `adoption` precisa resolver o `protetorId` do pet — via
  réplica local de pets alimentada pelos eventos `pet.created/updated` do catalog (mesmo padrão do
  `match_pets`/`CatalogPetConsumer`), e preencher `protetor_id` no `create()` a partir dela.
  Alternativa: o catalog expõe o `protetorId` e o adoption o consulta/recebe no fluxo de criação.

## ✅ R2 (RESOLVIDO) — Criação de conversa retorna 500

- **Sintoma:** `POST /v1/chat/conversations {adoptionRequestId}` → **500** (monolito: 201).
- **Causa:** mesma raiz — o `chat` não tem os dados da adoção; insere `protetorId` vazio numa
  coluna `uuid` → erro de Postgres. O fluxo pretendido é **auto-criação via evento** de adoção
  aprovada, mas com a R1 quebrada o evento nunca dispara.
- **Fix proposto:** depende da R1 (evento de aprovação com `adopterId`+`protetorId` corretos no
  payload, consumido pelo `AdoptionEventConsumer` do chat). Validar também o endpoint manual
  (`CreateConversationDto` não carrega `protetorId` — derivar do evento/replica, não de `''`).

---

## ✅ R4 (RESOLVIDO) — semântica do `:adotanteId`/`protetorId` mudou (resolução `usuario→perfil` abandonada)

- **Sintoma:** `GET /v1/match/questionario/{id}` e `/v1/match/resultado/{id}` → **403 no monolito,
  200 no micro** com o mesmo id. O monolito resolve `:adotanteId` como `adotantes.id` (via repo
  `usuario→adotante`); o micro usa `user.sub` (`usuarios.id`) direto. **O parâmetro mudou de
  significado** entre as arquiteturas.
- **Causa (raiz comum à R1):** o micro abandonou a resolução `usuario.id → perfil.id` e passou a
  tratar `user.sub` como se fosse o id do perfil (adotante/protetor). Isso gera (a) IDs de perfil
  inconsistentes gravados/consultados e (b) o `protetorId` vazio da R1.
- **Decisão necessária:** padronizar o contrato — ou os endpoints passam a usar `usuarios.id` em
  todo lugar (e o frontend se adapta), ou re-introduzir a resolução para `perfil.id`. Documentar
  no contrato de API qual id cada `:adotanteId`/`:protetorId` espera.

## Fix aplicado (R1 + R2 + R4)

- **R4 — id de perfil no JWT:** o `user-auth` resolve `adotantes.id`/`protetores_ongs.id` no
  login/refresh (`auth.service.generateTokenPair` agora async) e embute como claim
  `adotanteId`/`protetorId`. Os serviços (catalog, adoption, match, chat, reports) passaram a usar
  esse id de perfil (não `user.sub`) como identidade de dono. Restaura a semântica do monolito sem
  acoplamento cross-serviço.
- **R1 — réplica de pet no adoption:** novo `services/adoption/.../adoption/pets/` (schema
  `adoption_pets`, repo, `CatalogPetConsumer`) alimentado pelos eventos do catalog; `create()`
  resolve o `protetorId` por `findProtetorIdByPetId` (404 se o pet não está na réplica). Espelha o
  fix do match. Migration `0001_bent_shadowcat.sql`.
- **R2 — chat:** resolvido em cascata pelo R1+R4 (a aprovação dispara o evento com ids corretos →
  `AdoptionEventConsumer` auto-cria a conversa). O `POST /conversations` manual foi endurecido pra
  retornar 400 (em vez de 500) quando não há conversa ainda.
- **Re-teste E2E (2026-06-14):** approve/GET/reject adoção → 200; conversa auto-criada (1) +
  mensagens 201/200; posse de pet e match by-id → 403 (convergiram com o monolito).

## ✅ R5 (RESOLVIDO) — rota `PATCH /chat/conversations/{id}/read` ausente no micro

- **Sintoma:** `PATCH /v1/chat/conversations/{id}/read` → **404 "Cannot PATCH"** no micro (monolito:
  200). O método `markAllAsRead` existia no `conversation.service`, mas o controller do chat não
  expunha a rota (só `/active`).
- **Fix aplicado:** adicionado `@Patch(':id/read')` no `ConversationsController` (permissão
  `MESSAGES_WRITE`, igual ao `messages.controller`) delegando ao `markAllAsRead`. + teste de
  delegação no spec. Re-testado: **#31 → 200 `{markedAsRead:1}`**.

## ✅ R6 (RESOLVIDO) — eventos de adoção não chegavam ao reports

- **Sintoma:** `report_adoption_requests` sempre vazia → funil/KPIs de adoção do reports zerados,
  mesmo com adoções existindo. Log: `Consumer error on reports.service.adoption-created:
  RangeError: Invalid time value`.
- **Causa:** o evento `adoption-request.created` **não carregava `createdAt`/`updatedAt`**; o consumer
  fazia `new Date(undefined)` → Invalid Date → `.toISOString()` estoura → insert falha → descartado.
  (Pré-existente; o enriquecimento da R1 adicionou petId/protetorId/status mas esqueceu os timestamps.)
- **Fix aplicado:** adoption inclui `createdAt`/`updatedAt` (ISO) em `publishRequestCreated`/
  `publishRequestUpdated`; reports ganhou `parseDate()` defensivo. **Re-testado:
  `report_adoption_requests` 0 → 2, sem RangeError, funil reflete a adoção.**

## ✅ R7 (RESOLVIDO) — paginação de `GET /pets` era cosmética

- **Sintoma:** `GET /v1/pets?_size=2` retornava **todos** os pets em `data`, mas o `meta` dizia
  `itemsPerPage:2`. O `_page`/`_size` afetavam só o `meta`, não os dados.
- **Causa:** `PetsController.findAll` lia `_page/_size` só pro interceptor; não repassava ao
  `pet.service.findAll`, e o repo não tinha `limit/offset`.
- **Fix aplicado:** `PetFilters` ganhou `limit/offset`; o repo Drizzle aplica `.limit().offset()` +
  `count()` e retorna `{ rows, total }`; o service repassa; o controller calcula `limit=_size`,
  `offset=(_page-1)*_size`. O `HateoasInterceptor` já consumia `{rows,total}`. **Re-testado: page1
  fatiada em 2, page1≠page2 (offset real), `totalItems` real; deep-verify 23/23.**

## ✅ R8 (RESOLVIDO) — resumos de perfil (`{id,nome}`) vinham `null` no micro

- **Sintoma (corpo):** `pet.protetor`, `adoption.adopter`/`.protetor`, `conversation.adopter`/
  `.protetor`, `message.sender` vinham **`null`** no micro (eram `{id,nome}`/`{id,nome,tipo}` no
  monolito). O campo existia com o mesmo nome — só não era populado. Achado no diff estrutural de
  corpo (`body-compare.mjs`): nenhum outro campo faltando/renomeado/tipo-trocado.
- **Causa:** o serviço não resolvia o **nome** do perfil de outro contexto (vive no `user-auth`);
  `mapToResponse` setava `null` de propósito. Mesma classe das R1/R4: dado que cruzava bounded
  context no monolito não era replicado via evento no micro.
- **Fix aplicado (réplica de perfil via evento — mesmo padrão da réplica de pets):**
  - **user-auth (foundation):** novo contrato `UserAuthProfilePayload {id,nome,tipo}`; o
    `UserMessagingService` publica `publishProfileCreated/Updated` nos exchanges `user.created`/
    `user.updated` após o cadastro de adotante/protetor (commit da transação → publish).
  - **catalog / adoption / chat:** cada um ganhou um slice `profiles/` (schema `profiles`, repo
    `DrizzleProfileRepository` com `upsert/findById/findByIds`, e `UserAuthEventConsumer` em filas
    próprias `*.service.user-created/updated`). Os services resolvem os resumos por batch
    (`findByIds`) e populam os campos: `pet.protetor` (catalog), `adoption.adopter`/`.protetor`
    (adoption), `conversation.adopter`/`.protetor` + `message.sender` (chat — `tipo` derivado pela
    posição na conversa, igual ao `senderTipo` da última mensagem).
  - **Migrations:** `catalog/0001_dapper_impossible_man.sql`, `adoption/0002_sturdy_sunset_bain.sql`,
    `chat/0002_lyrical_scorpion.sql` (cada uma só cria a tabela `profiles`).
- **Re-teste E2E (2026-06-14, `body-compare.mjs`):** total de diffs de corpo **10 → 2**. Todos os
  endpoints de entidade (POST/GET pets, adoptions, conversation, messages) ficaram **estruturalmente
  idênticos** ao monolito — `protetor`/`adopter`/`sender` populados (`{id,nome}`/`{id,nome,tipo}`).
  Sonda dedicada confirmou que a **listagem** (`GET /pets`) também popula via `findByIds`. As 2
  diffs restantes são puramente **HATEOAS aditivo** (`_links`/envelope), aceitas.
- **Follow-up de dado (não-código):** entidades **legadas** criadas ANTES da replicação aparecem com
  resumo `null` (o perfil nunca foi publicado pra réplica). Para paridade em dado pré-existente,
  fazer um **backfill** único (republicar `profile.created` dos adotantes/protetores existentes, ou
  semear as tabelas `profiles`). Operacional — não bloqueia o código.

## ✅ R3 (RESOLVIDO) — `catalog` não migra no micro

- **Sintoma:** `drizzle-kit migrate` no container do `catalog` morria silencioso (exit 1) logo após
  conectar no DB — node22, DB vazio — enquanto os outros 5 serviços migravam normal. Crash-loop.
- **Causa-raiz (não era node22/drizzle-kit):** **journal corrompido**. O
  `services/catalog/drizzle/meta/_journal.json` tinha uma entry **fantasma** (`idx 1`,
  `0001_cool_hairball`, com timestamp fora de ordem) **sem `.sql` nem snapshot** correspondentes.
  O migrate lia o journal, tentava aplicar a migration idx 1, não achava o arquivo e morria sem
  imprimir o erro (engolido pelo spinner). Corrupção típica de merge — exatamente o cenário do
  CLAUDE.md.
- **Fix aplicado:** removida a entry fantasma do `_journal.json` (o `0000_grey_manta` já captura
  100% do schema atual — 16 colunas + 4 enums). `db:check` passa; o catalog rebuildado **migra do
  zero e sobe healthy pelo fluxo normal** (`db:migrate && start:prod`) — workaround removido.
  `__drizzle_migrations` = 1 registro.

> Nota separada: no **host com Node 24** o `drizzle-kit migrate` também falha (afetou o `user-auth`
> local) — esse é um problema de ambiente do Node 24, distinto do journal do catalog. Nos
> containers (`node:22-alpine`) o migrate funciona.

---

## Notas de comportamento (não bloqueiam, mas avisar o frontend)
- Listagem de pets: `array` (monolito) → envelope HATEOAS `{data,meta,_links}` (micro). **Único diff
  de corpo remanescente** (mais o `_links` aditivo nos itens) — ler a lista via `.data`.
- `pet.protetor` / `adoption.adopter|protetor` / `conversation.adopter|protetor` / `message.sender`:
  **populados nas duas** desde o R8 (réplica `profiles` via evento). Ressalva: dado **legado**
  (pré-replicação) vem `null` até um backfill — operacional, não código.
- Autorização por papel: mesmo resultado, mas mecanismo diferente (service-check → `PermissionsGuard`).
- `CreatePetDto` sem validação (é `interface`) → criar pet inválido = 500 nas duas (bug herdado).

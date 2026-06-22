# Comparação de comportamento — Monolito (`main`) vs Microsserviços (`developer`)

> Teste executado em 2026-06-14. Objetivo: rodar o mesmo conjunto de requisições nas duas
> arquiteturas e observar o que mudou **na prática** com a migração. Spoiler: não é neutro.

## Metodologia

- **Como rodou:** ambas via Docker (rede do compose), pois o host tem PostgreSQL nativo na 5432
  fazendo sombra nos containers. Monolito em `:3000` (prefixo `/api/v1`), micro nas portas
  `:4001–4006` (prefixo `/v1`). `developer` testado **com** os fixes #1/#2/#3 desta sessão.
- **Auth:** cadeia real (registro → login de protetor/ong e adotante via API), CPF/CNPJ válidos
  gerados por run.
- **Cobertura:** caminho crítico + fase aprofundada (ciclo de auth, posse, update/delete, CRUD de
  usuário, variantes de reports). **~65 cenários** por arquitetura.
- Runner único parametrizado por base-URL (sufixos de rota são idênticos entre as arquiteturas).

## Tabela comparativa

| Cenário | Monolito | Micro | Δ |
|---|---|---|---|
| REG protetor/ong · adotante · email duplicado | 201 · 201 · 409 | 201 · 201 · 409 | = |
| Login (protetor · adotante · senha errada) | 200 · 200 · 401 | 200 · 200 · 401 | = |
| Perfil /me (protetor · adotante) | 200 · 200 | 200 · 200 | = |
| /me sem token · tipo errado | 401 · 403 | 401 · 403 | = |
| Protetor cria pet | 201 | 201 | = |
| **Adotante cria pet** | 403 | 403 | = (mecanismo difere¹) |
| Criar pet sem token | 401 | 401 | = |
| **Criar pet com campos faltando** | **500** | **500** | = (bug compartilhado²) |
| **Listar pets** | `array` | `{data,meta,_links}` | **🟡 shape** |
| Filtro `?status=disponivel` | 200 | 200 | = |
| **GET pet/{id} → `protetor`** | `{id,nome}` | **`null`** | **🟡 perfil** |
| GET pet inexistente | 404 | 404 | = |
| Salvar/ler questionário match | 200 · 200 | 200 · 200 | = |
| **GET match/resultado** | total=13, contém pet | total=1, contém pet | 🟡 contagem³ |
| Protetor faz questionário (tipo errado) | 403 | 403 | = |
| Adotante cria solicitação de adoção | 201 | 201 | = |
| Solicitação sem token · petId inválido | 401 · 400 | 401 · 400 | = |
| Protetor lista solicitações | 200 | 200 | = |
| **Protetor APROVA adoção** | **200** | **403** | **🔴 QUEBRADO** |
| Conversas após aprovar (auto-criada?) | 0 | 0 | =⁴ |
| **Criar conversa (manual)** | **201** | **500** | **🔴 QUEBRADO** |
| Enviar/ler mensagem · marcar lida | 201 · 200 · 200 | (bloqueado pelo 500) | 🔴 |
| Reports dashboard/kpis/funnel/top-pets (protetor) | 200 ×4 | 200 ×4 | = |
| Adotante acessa reports | 403 | 403 | = (mecanismo difere¹) |

---

## 🔴 Diferenças CRÍTICAS (regressões da migração)

### 1. Pipeline de adoção quebrado — aprovação retorna 403
No micro, `POST /adoptions` grava a solicitação com **`protetorId` vazio**, porque o serviço
`adoption` **não tem acesso aos pets** (vivem no banco do `catalog`; o adoption não consome
eventos de pet nem consulta o catalog). Verificado no banco:

```
adoption_requests: pet_id=a2ea7c3d… | protetor_id=(vazio) | adopter_id=8136ecb6… | received
pets (catalog):    id=a2ea7c3d…     | protetor_id=a356cc7e…  ← o dado existe, mas no outro serviço
```

Quando o protetor aprova, a checagem de posse `adoption.protetorId === user.sub` falha →
**403 "Solicitação pertence a outro protetor/ong"**. No monolito funciona porque o adoption
consultava `pets.protetor_id` no mesmo banco.

**É a mesma classe de bug do match stub** (dependência cross-service cortada na migração) —
mas no adoption, e **ainda não corrigida**. Correção análoga à do match: o `adoption` precisa
do `protetorId` do pet via réplica/evento do catalog (ou enriquecer o evento de criação da
solicitação). **Bloqueia o fluxo central da plataforma.**

### 2. Criação de conversa retorna 500
Mesma raiz: o `chat` não tem os dados da adoção (serviço/banco separado). O `create()` insere
`protetorId` vazio numa coluna `uuid` → erro de Postgres → **500**. O fluxo "certo" no micro é a
**auto-criação via evento** quando a adoção é aprovada — mas como a aprovação está quebrada (#1),
o evento nunca dispara e o chat fica inacessível por completo.

---

## 🟡 Diferenças de comportamento (não quebram, mas afetam o frontend)

### 3. Shape da listagem de pets — `array` → envelope HATEOAS
- Monolito: `GET /pets` → **array puro** `[ {...}, {...} ]`.
- Micro: → **`{ data: [...], meta: {totalItems,...}, _links: {...} }`**.

O frontend que lê `response[0]` quebra; precisa ler `response.data[0]`. (O `HateoasInterceptor`
é aplicado de forma diferente entre as duas.)

### 4. `pet.protetor` (e `conversation.adopter/protetor`) vêm `null` no micro
O monolito populava o resumo do perfil (`{id, nome}`) via join no mesmo banco. O micro retorna
**`null`** — não há lookup cross-serviço. Telas que mostram "nome do protetor" no card do pet
ficam sem dado.

### 5. Match: contagem difere (dado), mas a réplica funciona
Monolito `total=13` (13 pets no banco único); micro `total=1` (só o pet criado no run propagou
pra `match_pets`). A diferença é de **dados** (bancos separados, réplica forward-only), não de
lógica. **Importante:** o pet recém-criado **apareceu** no resultado do micro (`contémPet=true`)
— confirmando que o fix #1 (réplica via evento RabbitMQ) **funciona ponta a ponta no stack real**.

---

## ⚪ Iguais / observações

1. **Autorização por papel — mesmo resultado, mecanismo diferente.** Adotante criando pet,
   adotante em reports, protetor no questionário: **403 nas duas**. Mas o monolito decide via
   checagem de `tipoUsuario` no service; o micro via `PermissionsGuard` + `permissions[]` no JWT.
   Convergem nos casos testados, mas **podem divergir** em endpoints não cobertos (a fonte da
   verdade da autorização é diferente).
2. **Validação de input do pet ausente nas DUAS.** `CreatePetDto` é `interface` (sem
   class-validator) → criar pet sem campos obrigatórios → **500** em ambas (não 400). Bug
   pré-existente herdado, não introduzido pela migração.
3. Prefixo `/api/v1` (monolito) → `/v1` + 6 portas (micro). Breaking pro frontend.

---

## Achados operacionais (ambiente / deploy)

- **`catalog` não migra no micro:** `drizzle-kit migrate` morre silencioso (exit 1) logo após
  conectar no DB, em node22, DB vazio — enquanto os outros 5 serviços migram normal. Específico
  do catalog. Destravado aplicando a SQL à mão; **precisa investigação à parte.**
- **Bootstrap de ambiente pré-existente:** `user-auth` entrou em crash-loop porque o DB tinha
  tabelas mas `__drizzle_migrations` vazio (migrate tentava recriar → "already exists"). É o
  cenário documentado no CLAUDE.md. Resolvido recriando o DB.
- **`RabbitMQService` sem auto-reconnect:** boot-race quando o RMQ não está pronto; o
  `restart: unless-stopped` do compose resolve, mas gera reinícios.

---

## Cobertura aprofundada — achados adicionais

Rodada estendida (~30 cenários a mais) confirmou e ampliou:

- **R1 é mais amplo que "só aprovar".** No micro, com `protetor_id` vazio na solicitação, **TODA**
  operação de adoção com checagem de posse falha: `GET /adoptions/{id}` → **403** e
  `PATCH .../status {rejected}` → **403** (monolito: 200 nos dois). O protetor nem consegue
  visualizar a solicitação.
- **🟡 NOVO — a semântica do path param `:adotanteId` mudou.** Mesmo request, status diferente:
  `GET /match/questionario/{id}` e `GET /match/resultado/{id}` →
  **403 no monolito, 200 no micro** (passando o `usuarios.id`). Motivo: o monolito resolve
  `:adotanteId` como `adotantes.id` (via repo `usuario→adotante`); o micro usa `user.sub`
  (`usuarios.id`) direto. **O parâmetro mudou de significado** — um frontend que passa o id correto
  do monolito recebe 403/dado errado no micro, e vice-versa. (Mesma raiz da `protetorId` vazia no
  adoption: o micro abandonou a resolução `usuario→perfil` e passou a usar `user.sub` como se fosse
  o id do perfil.)

### O que ficou IDÊNTICO na rodada aprofundada (≈50 cenários)
Importante registrar o que a migração **não** quebrou:
- **Ciclo de auth completo:** refresh (200) · reuso de refresh antigo → 401 (rotação funciona) ·
  logout (204) · logout-all (204).
- **Troca de senha** com `senhaAtual` errada → 401 nas duas.
- **Posse de pet:** 2º protetor editando/deletando pet alheio → **403** nas duas (regra de posse
  por `protetorId` do pet funciona — diferente do adoption, porque o `pets.protetor_id` É
  preenchido no catalog).
- Update de perfil (protetor/adotante) → 200 · `GET /users/{id}` e `/users/{inexistente}` → 403
  nas duas · todas as variantes de reports (stale-pets, timelines) → 200.

## Diff estrutural de corpo — campo a campo (2026-06-14)

Comparação de **estrutura** das respostas (chaves/tipos/null/campos extras) entre monolito e micro,
rodando o mesmo fluxo nas duas (`body-compare.mjs`). **Nenhum campo faltando, renomeado ou com tipo
trocado.** Na primeira rodada havia 12 diferenças em 2 padrões (resumo de perfil `null` + HATEOAS).

**Após o fix do R8** (réplica de resumo de perfil via evento do user-auth → catalog/adoption/chat),
o diff caiu para **2 diferenças, ambas HATEOAS aditivo:**

| Resultado | Endpoints |
|---|---|
| **Estrutura idêntica** | registro protetor/adotante, `POST /auth/login`, `GET /users/me`, `GET /users/{adotantes,protetores-ongs}/me`, `GET /match/resultado`, `GET /reports/dashboard`, **`POST /pets`**, **`POST /adoptions` + `GET /adoptions/{id}`**, **`conversation`**, **`POST /messages` + `GET /messages`** — resumos `protetor`/`adopter`/`sender` agora populados (`{id,nome}`/`{id,nome,tipo}`) |
| **HATEOAS** | `GET /pets` (lista) vem em envelope `{data,meta,_links}` (era array); `GET /pets/{id}` e itens da lista ganham campo extra `_links` |

**Impacto no frontend:** resta só ler a lista via `.data` (`_links`/`meta` são aditivos). Os resumos
de perfil deixaram de vir `null` — populados pela réplica `profiles` alimentada por
`user.created/updated`. **Sonda dedicada** confirmou que a listagem (`GET /pets`) também popula via
`findByIds`. **Ressalva de dado:** entidades **legadas** (criadas antes da replicação) ainda mostram
o resumo `null` porque o perfil nunca foi publicado pra réplica — é caso de **backfill** (operacional),
não de código. No `body-compare` isso aparece só dentro do diff já-HATEOAS da listagem (o `data[0]`
do micro é um pet antigo), não nos endpoints de entidade criados no run.

## Conclusão

A migração **não foi comportamentalmente neutra**. Além das mudanças esperadas (prefixo, portas,
HATEOAS, perfis null), **dois fluxos centrais quebraram** no micro — aprovação de adoção (403) e
criação de conversa (500) — pela mesma causa do match stub: **dependências de dado entre contextos
foram cortadas e não recriadas via evento/réplica.** O match foi corrigido primeiro; em seguida
**adoption (R1), chat (R2) e a semântica de id (R4) também foram corrigidos e re-testados** (abaixo).

## Re-teste pós-correção (2026-06-14)

Após implementar R1 (réplica de pet no adoption), R2 (auto-criação de conversa + hardening) e R4
(id de perfil embutido no JWT), o mesmo runner foi re-executado no micro. Resultado:

| Cenário | Micro ANTES | Micro DEPOIS |
|---|---|---|
| Aprovar adoção | 403 🔴 | **200** ✅ |
| GET adoção / rejeitar | 403 🔴 | **200** ✅ |
| Conversa após aprovar | 0 (não criava) 🔴 | **1 (auto-criada)** ✅ |
| Enviar / ler mensagem | 500 / bloqueado 🔴 | **201 / 200** ✅ |
| Posse de pet (2º protetor edita/deleta alheio) | 403 (via user.sub) | **403** (via id de perfil) ✅ |
| `:adotanteId` em match by-id | 200 (id errado) 🟡 | **403** (convergiu c/ monolito) ✅ |

**Divergências remanescentes (status) vs monolito:** nenhuma — o último gap
(`PATCH /chat/conversations/{id}/read` → 404, R5) foi corrigido (rota exposta no controller →
**200**). Diferenças de **corpo** permanecem (aceitas): envelope HATEOAS na listagem de pets e
`pet.protetor`/`conversation.adopter` = `null` (sem join cross-serviço). Bônus: o micro passou a
**auto-criar a conversa** ao aprovar — algo que o monolito não fazia.

### Verificação profunda pós-correção (micro, 2026-06-14) — 23/23 PASS

Rodada focada em estado + eventos (script `deep-verify.mjs` no worktree), validando o que a
arquitetura event-driven e os fixes afetam:
- **Ciclo de vida do pet → match:** criar → aparece no match (evento `pet.created` propaga pra
  `match_pets`); marcar **adotado** → **sai** do match (`pet.updated`); **deletar** → sai
  (`pet.deleted`). Score sempre 0..100.
- **Adoção (R1):** `protetorId` resolvido da réplica `adoption_pets`; consistência eventual tratada
  (adoção imediata após criar pet pode dar 404 até o evento propagar; após propagação → 201).
- **Chat (R2/R5/R4):** aprovar → conversa auto-criada; `unreadCount` correto (2) →
  `markAllAsRead` (`markedAsRead=2`) → `unreadCount=0`; `lastMessage` preenchido.
- **Reports:** KPIs/funnel retornam números reais alimentados pelos eventos.
- **Edge cases:** paginação `{data,meta}` respeita `_size`; enum/status inválidos rejeitados.

**Sobre o `DomainExceptionFilter` (#2):** está corretamente registrado, mas é inalcançável via API —
toda regra de domínio tem validator equivalente no DTO, então o `ValidationPipe` retorna 400 antes
de a entidade lançar. Não há risco observável de 500 por regra de domínio através dos endpoints; o
filtro é insurance pra caminhos que burlem um DTO.

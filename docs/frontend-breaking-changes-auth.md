# Breaking changes — Auditoria de segurança (auth + ownership)

> **TL;DR para o frontend:** todos os endpoints (exceto login, registro de
> usuário e health) agora exigem JWT. Vários DTOs perderam campos de
> identidade (`adopterId`, `protetorId`, `senderId`, etc.) — esses IDs
> agora são derivados do token, não enviados pelo cliente. Há também novas
> respostas `403 Forbidden` quando o usuário tenta acessar recurso de
> outro perfil. **Adicional:** responses agora vêm enriquecidas com `nome`
> dos participantes — não precisa mais fazer round-trip pra mostrar
> "Solicitação de João" / "Pet do Abrigo XYZ" / etc.
>
> Data: 2026-05-31 — branch `developer`.

---

## 1. Mudança transversal — JWT é obrigatório em tudo

### O que mudou

Um único `JwtAuthGuard` global protege a aplicação inteira. Endpoints
listados abaixo são as únicas exceções:

| Método | Rota | Por quê |
|---|---|---|
| `POST` | `/api/v1/auth/login` | público por definição |
| `POST` | `/api/v1/auth/refresh` | público por definição |
| `POST` | `/api/v1/users/adotantes` | cadastro de novo adotante |
| `POST` | `/api/v1/users/protetores-ongs` | cadastro de novo protetor/ong |
| `GET`  | `/api/v1/health` | health-check |

**Qualquer outra rota** sem o header `Authorization: Bearer <jwt>` agora
responde `401 Unauthorized`. Inclui `GET /pets`, `GET /adoptions`, etc. —
não há mais endpoints "públicos por esquecimento".

### O que o front precisa verificar

- [ ] Garantir que o interceptor que injeta `Authorization` está
      cobrindo TODAS as chamadas (não só as antigamente protegidas).
- [ ] Confirmar que o fluxo de refresh roda em `401` antes de mostrar
      a tela de login.
- [ ] Conferir se nenhum lugar do app exibe lista de pets antes do
      login — se exibe, esse fluxo precisa ser repensado (login obrigatório
      antes do catálogo foi decisão de produto).

---

## 2. Novos códigos HTTP de erro

| Código | Quando aparece |
|---|---|
| `401` | Token ausente, expirado ou inválido. |
| `403` | Token OK, mas o usuário não tem permissão para o recurso (ex.: protetor A editando pet do protetor B, adotante tentando ver questionário de outro adotante). |
| `404` | Recurso não encontrado **ou** o JWT é de um `usuarios.id` que não tem perfil correspondente em `adotantes`/`protetores_ongs`. |

Front deve tratar `403` distinto de `401`: em `403`, NÃO faz refresh
nem redireciona pra login — é caso de UI ("você não tem acesso a esse
recurso"). Em `401`, sim, refresh + relogin.

---

## 3. Responses enriquecidos — perfis inline (id + nome)

### O que mudou

Antes, as responses listavam só os UUIDs (`adopterId`, `protetorId`,
`senderId`). Pra mostrar o nome de cada participante, o front
precisaria de uma chamada extra por ID — N+1.

Agora as responses incluem objetos `adopter`, `protetor` e/ou `sender`
com `id + nome`, populados pelo backend via batch lookup (JOIN com
`usuarios.nome`). **Os IDs raw continuam no payload** — nenhum campo
foi removido, só adicionado.

### Forma dos novos campos

```ts
type ProfileSummary = {
  id: string;        // adotantes.id ou protetores_ongs.id
  nome: string;      // de usuarios.nome
} | null;            // null se o perfil foi excluído

type SenderSummary = ProfileSummary & {
  tipo: 'adotante' | 'protetor';  // discrimina o tipo de perfil
};
```

### Onde aparece

| Response | Campos adicionados |
|---|---|
| `GET /pets`, `GET /pets/:id`, `GET /pets/protetor/:protetorId`, `POST /pets`, `PATCH /pets/:id` | `protetor: ProfileSummary` |
| `GET /adoptions`, `GET /adoptions/:id`, `POST /adoptions`, `PATCH /adoptions/:id/status` | `adopter: ProfileSummary` e `protetor: ProfileSummary` |
| `GET /chat/conversations`, `GET /chat/conversations/:id`, `POST /chat/conversations`, `PATCH /chat/conversations/:id/active` | `adopter: ProfileSummary` e `protetor: ProfileSummary` |
| `GET /chat/conversations/:id/messages`, `POST .../messages`, `PATCH /chat/messages/:id/read` | `sender: SenderSummary` |

### Notas importantes

- **Foto não vem no summary.** O campo `imagemBase64` dos perfis pode
  ter MBs — entregar isso em cada item de lista seria absurdo. Front
  que quiser mostrar avatar usa endpoint dedicado de perfil
  (`GET /users/adotantes/me`, `GET /users/protetores-ongs/me`, etc.)
  pra buscar o base64 quando necessário.
- **`sender.tipo` no chat:** discrimina se o `senderId` da mensagem
  é um `adotantes.id` ou `protetores_ongs.id`. Front pode usar
  diretamente em vez de comparar com `adopterId`/`protetorId` da
  conversa.
- **Pode ser `null`?** Sim, se o perfil foi excluído depois da
  criação do recurso. Front deve ter fallback (ex.: "Usuário
  removido").

### Exemplo — `GET /adoptions`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "petId": "<uuid>",
    "adopterId": "<uuid-adotantes>",
    "protetorId": "<uuid-protetores>",
    "adopter": {
      "id": "<uuid-adotantes>",
      "nome": "João da Silva"
    },
    "protetor": {
      "id": "<uuid-protetores>",
      "nome": "Abrigo Quatro Patas"
    },
    "status": "received",
    "preTriageStatus": "qualified",
    "matchScore": 82,
    "matchAnswers": { "tipoMoradia": "apartamento" },
    "notes": "Tenho experiência...",
    "createdAt": "2026-05-30T12:34:56.000Z",
    "updatedAt": "2026-05-30T12:34:56.000Z"
  }
]
```

### Exemplo — `GET /chat/conversations/:id/messages`

```json
[
  {
    "id": "<uuid>",
    "conversationId": "<uuid>",
    "senderId": "<uuid-protetores>",
    "sender": {
      "id": "<uuid-protetores>",
      "nome": "Abrigo Quatro Patas",
      "tipo": "protetor"
    },
    "content": "Oi! Bem-vindo, posso ajudar?",
    "isRead": false,
    "createdAt": "2026-05-30T13:00:00.000Z",
    "updatedAt": "2026-05-30T13:00:00.000Z"
  }
]
```

### Checklist do front

- [ ] Listas e telas de detalhe podem parar de fazer chamadas extras
      pra buscar nome de adotante/protetor — usar `adopter.nome` /
      `protetor.nome` direto do response.
- [ ] Render do balão de mensagem pode usar `sender.tipo` em vez de
      comparar `senderId` com IDs do usuário logado.
- [ ] Tratar `adopter === null` / `protetor === null` / `sender === null`
      (raro, mas pode acontecer com perfil excluído).
- [ ] Se quiser avatar, continue chamando o endpoint de perfil
      separadamente — foto não vem no summary.

---

## 4. Catálogo de pets (`@catalog/pets`)

### Breaking changes

#### `POST /api/v1/pets`

**Removido do body:** `protetorId`.

O backend agora deriva o `protetorId` a partir do JWT do usuário
autenticado (precisa ser `tipoUsuario` = `protetor` ou `ong`).

```diff
  POST /api/v1/pets
  Authorization: Bearer <jwt-do-protetor>
  {
    "nome": "Rex",
    "especie": "cao",
    "porte": "medio",
    "sexo": "macho",
    "idadeMeses": 24,
    "castrado": true,
    "vacinado": true,
-   "protetorId": "<uuid>"
  }
```

#### `PATCH /api/v1/pets/:id` e `DELETE /api/v1/pets/:id`

Agora retornam `403 Forbidden` se o pet pertencer a outro protetor.
Antes, qualquer usuário podia editar/deletar qualquer pet.

#### `GET /api/v1/pets` (e variantes)

Não mudou o contrato — mas agora exige JWT. Listagem segue retornando
todos os pets do sistema.

### Checklist do front

- [ ] Tela "Cadastrar pet": remover campo/payload `protetorId`.
- [ ] Tela "Editar pet" e "Excluir pet": tratar `403` (mostrar "este
      pet não é seu" — não deveria acontecer pelo fluxo normal, mas
      proteger contra deep-link).

---

## 5. Solicitações de adoção (`@adoption/adoption-requests`)

### Breaking changes

#### `POST /api/v1/adoptions`

**Removidos do body:** `adopterId` e `protetorId`.

- `adopterId` vem do JWT (usuário precisa ser `adotante`).
- `protetorId` é derivado de `pets.protetor_id` do `petId` enviado.

```diff
  POST /api/v1/adoptions
  Authorization: Bearer <jwt-do-adotante>
  {
    "petId": "<uuid>",
-   "adopterId": "<uuid>",
-   "protetorId": "<uuid>",
    "mensagem": "Tenho experiência...",
    "matchScore": 82,
    "questionario": { ... }
  }
```

#### `GET /api/v1/adoptions`

**Filtragem agora é automática pelo JWT:**

- Se logado como `adotante` → retorna só solicitações criadas por ele.
- Se logado como `protetor`/`ong` → retorna só solicitações destinadas
  a ele.

Front **não precisa mais** enviar query param de filtro — qualquer
filtro que estiver sendo enviado será ignorado.

#### `GET /api/v1/adoptions/:id`

Retorna `403` se o usuário autenticado não for nem o adotante criador
nem o protetor dono do pet.

#### `PATCH /api/v1/adoptions/:id/status`

Apenas o **protetor/ong dono do pet** pode mudar status. Adotantes
recebem `403`. Body inalterado.

#### `DELETE /api/v1/adoptions/:id`

Apenas o **adotante criador** pode deletar. Protetores recebem `403`.

### Checklist do front

- [ ] Tela "Solicitar adoção": remover `adopterId` e `protetorId` do
      payload.
- [ ] Tela "Minhas solicitações" (lado adotante): pode parar de mandar
      filtro `?adopterId=...` — backend já filtra.
- [ ] Tela "Solicitações recebidas" (lado ONG/protetor): idem, pode
      parar de mandar `?protetorId=...`.
- [ ] Botão "Aprovar/Rejeitar" só deve aparecer pro protetor (front
      já sabe pelo tipoUsuario do usuário logado).
- [ ] Botão "Cancelar solicitação" só deve aparecer pro adotante.

---

## 6. Chat — Conversas (`@chat/conversations`)

### Breaking changes

#### `POST /api/v1/chat/conversations`

**Removidos do body:** `adopterId` e `protetorId`.

Esses IDs são herdados da `adoption_request` referenciada — não podem
ser passados pelo cliente. O usuário autenticado precisa ser
participante daquela adoption request (adotante criador ou protetor
dono do pet).

```diff
  POST /api/v1/chat/conversations
  Authorization: Bearer <jwt>
  {
    "adoptionRequestId": "<uuid>",
-   "adopterId": "<uuid>",
-   "protetorId": "<uuid>"
  }
```

A resposta continua trazendo `adopterId` e `protetorId` no payload
(preenchidos pelo backend).

#### `GET /api/v1/chat/conversations`

**Query params removidos:** `adopterId`, `protetorId`.

O backend filtra automaticamente pelas conversas onde o usuário
autenticado é participante. Não precisa mais (e não adianta) enviar
filtro.

```diff
- GET /api/v1/chat/conversations?adopterId=<uuid>
+ GET /api/v1/chat/conversations
```

#### `GET /api/v1/chat/conversations/:id` e `PATCH /api/v1/chat/conversations/:id/active`

Retornam `403` se o usuário não for participante.

### Checklist do front

- [ ] Tela "Iniciar conversa": remover `adopterId` e `protetorId` do
      payload.
- [ ] Lista de conversas: remover query params; usar GET puro.
- [ ] Abrir conversa por deep-link: tratar `403` ("conversa não é sua").

---

## 7. Chat — Mensagens (`@chat/conversations/messages`)

### Breaking changes

#### `POST /api/v1/chat/conversations/:conversationId/messages`

**Removido do body:** `senderId`.

O `senderId` que vai pro banco é derivado do JWT — para um adotante,
vira `adotantes.id`; para protetor/ong, vira `protetores_ongs.id`.

```diff
  POST /api/v1/chat/conversations/<id>/messages
  Authorization: Bearer <jwt>
  {
-   "senderId": "<uuid>",
    "content": "Oi, ainda tem o pet disponível?"
  }
```

Retorna `403` se o usuário não for participante da conversa.

#### `GET /api/v1/chat/conversations/:conversationId/messages`

Sem mudança de body/query, mas exige participação na conversa
(`403` se não for).

#### `PATCH /api/v1/chat/messages/:id/read`

Exige participação na conversa da mensagem (`403` se não for).

### Checklist do front

- [ ] Enviar mensagem: remover `senderId` do payload.
- [ ] Render do balão de mensagem: o `senderId` vindo na resposta agora
      é `adotantes.id` ou `protetores_ongs.id` (não mais `usuarios.id`).
      Se o front compara com algum ID do usuário logado pra decidir o
      lado do balão, precisa comparar com o ID do **perfil** do usuário
      (`adotanteId` / `protetorId`), não com `usuarios.id`.

---

## 8. Match — Questionário (`@match/questionario`)

### Bug semântico corrigido (importante)

Antes, o backend tratava `usuarios.id` como se fosse `adotantes.id` —
o que era um bug porque `adoption_requests.adopter_id` aponta pra
`adotantes.id`. **Agora o `adotanteId` retornado nas respostas é o
verdadeiro `adotantes.id`.**

Se o front estava salvando ou comparando o `adotanteId` recebido das
respostas de match com `usuarios.id`, isso **vai parar de funcionar**.

### Breaking changes

#### `POST /api/v1/match/questionario`

Continua sem `adotanteId` no body (já era derivado do usuário antes).
Mas: agora exige `tipoUsuario` = `adotante`. Protetores/ONGs recebem
`403`.

#### `GET /api/v1/match/questionario/:adotanteId` e `GET /api/v1/match/resultado/:adotanteId`

Agora exigem que o `:adotanteId` da URL seja igual ao do adotante
autenticado. Caso contrário, `403`. Na prática:

- O front pode continuar usando estes endpoints, mas precisa ter
  certeza de que o ID na URL é o do próprio usuário.
- A alternativa mais simples (e recomendada) é usar os endpoints
  sem param: `GET /api/v1/match/questionario` e
  `GET /api/v1/match/resultado` — eles resolvem o adotante via JWT.

### Checklist do front

- [ ] Onde estiver salvando o `adotanteId` retornado pelas respostas
      de match: garantir que está armazenando como ID do **perfil**
      (não confundir com `usuarios.id`).
- [ ] Preferir os endpoints sem `:adotanteId` na URL — mais simples e
      sem risco de 403.
- [ ] Esconder/desabilitar telas de match quando `tipoUsuario` ≠
      `adotante`.

---

## 9. Resumo da regra mental

A partir desta versão, vale a seguinte regra para qualquer payload
enviado ao backend:

> **Se o ID identifica QUEM está fazendo a requisição, ele NÃO vai no
> body.** O backend descobre isso pelo JWT.

Em particular, NÃO mande no body:

- `adopterId` / `adopterUsuarioId`
- `protetorId` / `protetorUsuarioId`
- `senderId`
- `usuarioId`

IDs de **terceiros** (`petId`, `adoptionRequestId`, `conversationId`,
etc.) continuam normalmente no body/URL — eles identificam o recurso,
não o autor da ação.

---

## 10. Testes sugeridos antes de subir o front

1. Login normal → catálogo carrega.
2. Forçar token expirado → ver se interceptor de refresh dispara.
3. Forçar token inválido → ver se cai pra tela de login (`401`).
4. Logar como protetor A, tentar abrir URL de edição de pet do
   protetor B → ver mensagem amigável de "não autorizado" (`403`).
5. Logar como adotante, abrir lista de solicitações → só vê as
   próprias.
6. Logar como protetor, abrir lista de solicitações → só vê as
   destinadas a ele.
7. Criar adoption request sem `adopterId`/`protetorId` no body →
   sucesso `201`.
8. Criar conversa só com `adoptionRequestId` → sucesso `201`.
9. Enviar mensagem sem `senderId` → sucesso `201`; balão renderiza no
   lado certo.

---

## 11. Em caso de dúvida

- Swagger atualizado em `/api/v1/docs` (local) ou no host de produção.
- Se um endpoint específico continuar exigindo algum campo que esta
  página diz que foi removido, é bug — abrir issue mencionando rota,
  payload e response.

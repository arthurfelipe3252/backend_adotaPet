# Fixes do backend — 2026-05-31

> **TL;DR:** quatro bugs corrigidos em produção. Três deles eram do
> POST de criação não retornando o `id` do recurso recém-criado, o
> que travava qualquer navegação subsequente ("acabei de criar, qual
> é o id?"). O quarto era o módulo de match que retornava 500. Tudo
> resolvido. Se o front tem workarounds (fazer GET depois do POST
> pra achar o recurso, esconder match porque tava quebrado), pode
> remover.

Deploy: `23a1c6a` em main. Schema do match foi corrigido via SQL
direto em prod.

---

## 1. `POST /adoptions` agora retorna `id`

### Antes

```json
{
  "petId": "...",
  "adopterId": "...",
  "protetorId": "...",
  "adopter": { "id": "...", "nome": "Maria Santos" },
  "protetor": { "id": "...", "nome": "Arthur Souza" },
  "status": "received",
  ...
}
```

Faltava `id` da solicitação criada. Front precisava fazer
`GET /adoptions`, filtrar por `petId` + data mais recente, pra
descobrir o id da própria solicitação que acabou de criar.

### Agora

```json
{
  "id": "05b4b9ec-50e2-4e9a-bb34-184d68f38ea5",   // ← novo
  "petId": "...",
  "adopterId": "...",
  ...
}
```

### Checklist front
- [ ] Remover o `GET /adoptions` extra após criar — usar `response.id`
      direto.

---

## 2. `POST /chat/conversations` agora retorna `id` válido

### Antes

```json
{
  "id": "",                              // ← string vazia
  "adoptionRequestId": "...",
  "adopter": { "id": "...", "nome": "..." },
  ...
}
```

### Agora

```json
{
  "id": "5999f4ff-512f-4b83-9273-fc0fec91389a",
  "adoptionRequestId": "...",
  ...
}
```

### Checklist front
- [ ] Remover qualquer guard `if (conv.id)` antes de navegar.
- [ ] Remover fallback de `GET /chat/conversations` após criar.

---

## 3. `POST /chat/conversations/:id/messages` agora retorna `id` e `sender`

### Antes

```json
{
  "id": "",
  "conversationId": "...",
  "senderId": "...",
  "sender": null,         // ← também faltava
  "content": "..."
}
```

### Agora

```json
{
  "id": "d83b8cec-f5ba-4d67-8faf-f1f16b6b5b3d",
  "conversationId": "...",
  "senderId": "...",
  "sender": {
    "id": "90fcd1f8-...",
    "nome": "Maria Santos",
    "tipo": "adotante"           // "adotante" | "protetor"
  },
  "content": "...",
  ...
}
```

### Checklist front
- [ ] Posicionamento do balão da mensagem pode usar `message.sender.tipo`
      direto (em vez de cruzar `senderId` com a conversa).
- [ ] Mostrar nome do remetente direto de `message.sender.nome`.

---

## 4. `POST /match/questionario` (e GET) — não dá mais 500

### Antes

Qualquer chamada a `/api/v1/match/*` em prod retornava:

```json
{ "statusCode": 500, "message": "Internal server error" }
```

### Causa

Estado divergente no banco: a tabela existia com nome antigo
(`questionarios_match` plural, schema com booleanos), e o código
esperava `questionario_match` (singular, schema com enums). O bootstrap
de migrations registrou o hash sem rodar o CREATE.

### Agora

Schema corrigido. Endpoint funciona normal:

```json
POST /api/v1/match/questionario
{
  "tipoMoradia": "apartamento",          // | casa_quintal_grande | casa_quintal_pequeno | apartamento_lazer
  "disponibilidade": "sai_almoco",       // | fica_em_casa | passa_dia_fora | viaja_frequentemente
  "experienciaPrevia": "sim_tem_experiencia",  // | sim_faz_tempo | nunca_quer_aprender | primeiro_pet_familia
  "criancasEmCasa": "nao",               // | bebe | crianca_pequena | crianca_maior
  "outrosPets": "nao",                   // | cao | gato | outros
  "perfilCompanheiro": "tranquilo"       // | energetico | carinhoso | inteligente
}

→ 200 OK
{
  "id": "051a040c-8816-40bb-9f32-ca212f00d916",
  "adotanteId": "90fcd1f8-...",
  "tipoMoradia": "apartamento",
  ...
}
```

Endpoints disponíveis:

| Verbo | Rota | Quem pode |
|---|---|---|
| `POST` | `/match/questionario` | adotante (cria ou atualiza o próprio) |
| `GET` | `/match/questionario` | adotante (busca o próprio) |
| `GET` | `/match/questionario/:adotanteId` | adotante (só o próprio — 403 se não bater) |
| `GET` | `/match/resultado` | adotante (calcula match com pets disponíveis) |
| `GET` | `/match/resultado/:adotanteId` | adotante (só o próprio — 403) |
| `DELETE` | `/match/questionario` | adotante (apaga pra refazer o quiz) |

### Checklist front
- [ ] Re-habilitar a tela de questionário de match se tinha sido
      desligada por causa do 500.
- [ ] Re-habilitar a tela de "pets recomendados" via
      `GET /match/resultado`.

---

## 5. Dados de teste em prod (referência)

Pra testar a interface de protetor/ONG, está populado em prod:

| Login | Senha | Perfil |
|---|---|---|
| `arthur@gmail.com` | `arthur30052006` | **Protetor principal** — 13 pets, 33 solicitações recebidas, 8 conversas |
| `contato@quatropatas.org` | `ongQuatroPatas1` | ONG — 6 pets |
| `joao.protetor@gmail.com` | `joaoProtetor1` | Protetor PF — 3 pets |
| `maria@gmail.com` | `senha12345` | Adotante (com questionário preenchido) |
| `carlos@gmail.com` | `senha12345` | Adotante |
| `ana@gmail.com` | `senha12345` | Adotante |
| `pedro@gmail.com` | `senha12345` | Adotante |
| `julia@gmail.com` | `senha12345` | Adotante |
| `rafael@gmail.com` | `senha12345` | Adotante |
| `beatriz@gmail.com` | `senha12345` | Adotante |
| `thiago@gmail.com` | `senha12345` | Adotante |

**Logando como Arthur** o front consegue exercitar:

- Lista de pets próprios com mix de status (9 disponíveis, 2
  adotados, 2 em processo).
- 33 solicitações recebidas distribuídas em todos os status
  (received, in_analysis, approved, rejected).
- 8 conversas ativas com 8 adotantes diferentes, com mensagens.
- 2 pets "stale" sem solicitação alguma (Spike, Apolo) — bom pra
  testar o widget de "pets parados" do dashboard de reports.

**Dashboard de reports** (`GET /api/v1/reports/dashboard`) já
funciona com esses dados — KPIs, funnel, top-pets, stale-pets.

---

## Em caso de dúvida

- Swagger atualizado em `/api/v1/docs`.
- Se algum dos comportamentos acima diferir do que está sendo
  observado em prod, é bug — flag pra gente com endpoint + payload
  + response.

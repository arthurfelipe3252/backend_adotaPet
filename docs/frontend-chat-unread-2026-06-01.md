# Chat — não-lidas, mark-all-as-read e prévia da última mensagem

> **TL;DR:** atendendo à demanda do front, `GET /chat/conversations` (e o
> single) agora trazem `unreadCount` + `lastMessage`. Novo endpoint
> `PATCH /chat/conversations/:id/read` zera as não-lidas de uma vez. A
> lista volta ordenada por última atividade desc.

---

## 1. Novos campos em `ConversationResponseDto`

Aplicam tanto em `GET /chat/conversations` (lista) quanto em
`GET /chat/conversations/:id` (single) e nos responses de POST/PATCH
desses endpoints.

```diff
  {
    "id": "...",
    "adoptionRequestId": "...",
    "adopterId": "...",
    "protetorId": "...",
    "adopter": { "id": "...", "nome": "..." },
    "protetor": { "id": "...", "nome": "..." },
    "isActive": true,
+   "unreadCount": 3,
+   "lastMessage": {
+     "content": "Combinado, sábado às 14h!",
+     "createdAt": "2026-06-01T18:45:12.000Z",
+     "senderTipo": "adotante"
+   },
    "createdAt": "...",
    "updatedAt": "..."
  }
```

- `unreadCount` (int) — quantas mensagens nessa conversa foram enviadas
  pela **outra parte** e ainda estão `isRead = false`. Filtragem é
  automática pelo JWT (do ponto de vista do usuário logado).
- `lastMessage` — `null` se a conversa não tem mensagens ainda. Senão
  traz `content`, `createdAt` (ISO 8601) e `senderTipo` já discriminado
  (`'adotante' | 'protetor'`).

## 2. Ordenação da lista

`GET /chat/conversations` agora vem ordenado por `lastMessage.createdAt`
desc; conversas sem mensagens caem pro fim ordenadas por `updatedAt`
desc. Front não precisa mais ordenar no cliente.

## 3. Novo endpoint — marcar conversa inteira como lida

```
PATCH /api/v1/chat/conversations/:id/read
Authorization: Bearer <jwt>
→ 200 OK
{
  "markedAsRead": 3
}
```

- Marca como lidas todas as mensagens da conversa enviadas pela outra
  parte que ainda estavam não-lidas.
- Mensagens enviadas pelo próprio usuário não são tocadas (sempre
  ficam como estavam).
- Retorna `markedAsRead` = nº de mensagens afetadas (0 se já estava
  tudo lido). Front pode usar pra atualizar contadores sem refetch.
- 403 se o usuário não for participante; 404 se a conversa não existe.

## 4. Mudança de comportamento — `PATCH /chat/messages/:id/read`

> **Atenção** se o front ainda usa esse endpoint pra alguma coisa.

Antes: aceitava qualquer mensagem da conversa em que o usuário fosse
participante, inclusive a mensagem que ele próprio enviou.

Agora: marcar a **própria** mensagem como lida retorna `400`:

```json
{
  "statusCode": 400,
  "message": "Não é possível marcar a própria mensagem como lida"
}
```

Justificativa semântica + `unreadCount` já filtrava `sender_id != viewer`,
então marcar a própria nunca afetou a UI. O front que estiver usando
esse endpoint pra marcar uma mensagem recebida específica (não a
conversa toda) continua funcionando normal.

Recomendação: migrar do `PATCH /messages/:id/read` (por-mensagem) para
o `PATCH /conversations/:id/read` (em lote) — uma chamada só ao abrir
a conversa zera o badge.

## 5. Checklist do front

- [ ] Lista de conversas: renderizar badge usando `unreadCount`,
      preview usando `lastMessage.content` + `lastMessage.createdAt`.
- [ ] Posicionamento da preview na bolha (esquerda/direita): pode usar
      `lastMessage.senderTipo` direto.
- [ ] Remover ordenação client-side por updatedAt — a API já ordena.
- [ ] Ao abrir a conversa: chamar `PATCH /chat/conversations/:id/read`.
      Atualizar localmente `unreadCount = 0` (ou usar o `markedAsRead`
      retornado).
- [ ] Se ainda chamar `PATCH /messages/:id/read` em algum lugar,
      garantir que é só pra mensagens da outra parte (qualquer outro
      caso retornará 400).

## 6. Em caso de dúvida

- Swagger atualizado em `/api/v1/docs`.
- KPI `mensagensNaoLidas` do dashboard de reports continua válido e
  bate com a soma dos `unreadCount` das conversas do protetor —
  ambos puxam da mesma query.

## Resumo

<!-- 1-3 linhas: o que esse PR faz e por quê -->

## Mudou schema do banco?

- [ ] **NÃO** — pular esta seção.
- [ ] **SIM** — segui o checklist:
  - [ ] Editei o `*.schema.ts` correspondente em `src/modules/<modulo>/infra/schemas/`
  - [ ] Rodei `npm run db:generate` localmente
  - [ ] **Revisei o `.sql` gerado** em `src/shared/infra/database/drizzle/` (o drizzle às vezes inclui DROP/ALTER inesperados)
  - [ ] Apliquei localmente com `npm run db:migrate` e confirmei que o schema fica como esperado
  - [ ] Confirmei que **nenhum outro PR aberto** tem migration pendente (política: 1 migration por PR ativo)
  - [ ] `npm run db:check` passa

## Plano de teste

<!-- Como reviewer/QA reproduz a verificação -->

## Riscos

<!-- Algo que pode dar errado em produção? rollback plan? -->

---

> 📚 Convenções: [`CLAUDE.md`](../CLAUDE.md) > seções **Convenções de código** e **Migrations**.
> Em caso de conflito no `_journal.json`, **regenerar do zero** (deletar journal+meta e rodar `db:generate`).

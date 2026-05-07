import type { DrizzleService } from '@shared/infra/database/drizzle.service';

/**
 * Executor que aceita tanto a conexão raiz quanto uma transação ativa.
 * Permite que repositórios participem de transações iniciadas em camadas
 * superiores (services de orquestração) sem expor o tipo interno do Drizzle
 * em cada módulo.
 *
 * Uso típico:
 *   async criar(entidade: X, executor: DbExecutor = this.drizzle.db) { ... }
 *
 * Quando o service abre uma transação com `this.drizzle.db.transaction(async (tx) => …)`,
 * passa `tx` no `executor`. Quando não há transação, o repositório usa o
 * default (o `db` do `DrizzleService`).
 */
export type DbExecutor =
  | DrizzleService['db']
  | Parameters<Parameters<DrizzleService['db']['transaction']>[0]>[0];

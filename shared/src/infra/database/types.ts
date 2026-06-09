import type { DrizzleService } from './drizzle.service';

export type DbExecutor =
  | DrizzleService['db']
  | Parameters<Parameters<DrizzleService['db']['transaction']>[0]>[0];

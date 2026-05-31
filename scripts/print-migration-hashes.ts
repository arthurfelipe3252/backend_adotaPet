/* eslint-disable no-console */
import path from 'node:path';
import { readMigrationFiles } from 'drizzle-orm/migrator';

/**
 * Imprime os hashes que `drizzle-kit migrate` calcula para cada arquivo
 * de migration no projeto. Útil para bootstrap manual em ambientes que
 * já têm o schema aplicado — basta inserir o hash impresso aqui na
 * tabela `drizzle.__drizzle_migrations` para marcar a baseline como
 * "já aplicada" sem precisar rodar o SQL.
 *
 * Uso:
 *   npx ts-node ./scripts/print-migration-hashes.ts
 */
const migrations = readMigrationFiles({
  migrationsFolder: path.join(
    process.cwd(),
    'src/shared/infra/database/drizzle',
  ),
});

console.log(`Found ${migrations.length} migration(s):\n`);
for (const m of migrations) {
  const tag = (m as { tag?: string }).tag ?? '?';
  console.log(`  tag:   ${tag}`);
  console.log(`  hash:  ${m.hash}`);
  console.log(`  when:  ${m.folderMillis}`);
  console.log('');
}

console.log('Para registrar manualmente em prod (bootstrap):');
console.log('');
for (const m of migrations) {
  console.log(`  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)`);
  console.log(`  VALUES ('${m.hash}', ${m.folderMillis})`);
  console.log(`  ON CONFLICT DO NOTHING;`);
  console.log('');
}

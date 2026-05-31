import path from 'node:path';
import { Pool } from 'pg';
import { readMigrationFiles } from 'drizzle-orm/migrator';

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations.');
  }

  const parsedUrl = new URL(databaseUrl);
  const strictMigrations = process.env.STRICT_MIGRATIONS === 'true';

  const migrationsFolder = path.join(
    process.cwd(),
    'src/shared/infra/database/drizzle',
  );

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
    await client.query(
      'CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)',
    );

    const last = await client.query(
      'select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1',
    );
    let lastApplied = Number(last.rows[0]?.created_at ?? 0);

    const migrations = readMigrationFiles({ migrationsFolder });

    for (const migration of migrations) {
      if (lastApplied >= migration.folderMillis) continue;

      for (const stmt of migration.sql) {
        try {
          await client.query(stmt);
        } catch (error) {
          const pgError = error as { code?: string };
          const isDuplicateType =
            pgError.code === '42710' && stmt.toLowerCase().includes('create type');
          if (!isDuplicateType || strictMigrations) throw error;
        }
      }

      await client.query(
        'insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)',
        [migration.hash, migration.folderMillis],
      );
      lastApplied = migration.folderMillis;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

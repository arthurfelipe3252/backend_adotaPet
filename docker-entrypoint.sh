#!/bin/sh
set -e

# Aplica migrations Drizzle antes de subir o app. Retry porque DB externo
# (Neon/Supabase) pode ter cold start na 1ª conexão do dia.
#
# Usa `npx drizzle-kit migrate` (CLI oficial). A source-of-truth é o
# `_journal.json` em `src/shared/infra/database/drizzle/meta/` — gerado
# por `npm run db:generate` a partir dos schemas TS.
#
# Política de PR (ver CLAUDE.md > Migrations): apenas 1 PR com migration
# por vez. Conflitos no journal exigem regeração antes do merge. CI
# valida integridade do journal via `drizzle-kit check`.
attempts=0
max_attempts=10

echo "==> Aplicando migrations Drizzle (drizzle-kit migrate)..."

while [ "$attempts" -lt "$max_attempts" ]; do
  attempts=$((attempts + 1))

  # tee preserva a saída completa caso o spinner do drizzle-kit (\r)
  # sobrescreva o erro real durante uma falha.
  if npx drizzle-kit migrate 2>&1 | tee /tmp/migrate.log; then
    echo "==> Migrations aplicadas. Iniciando NestJS..."
    exec node dist/main.js
  fi

  echo "----- Saída completa da tentativa ${attempts} -----"
  cat /tmp/migrate.log
  echo "---------------------------------------------------"

  if [ "$attempts" -ge "$max_attempts" ]; then
    echo "ERRO: migrations falharam após ${max_attempts} tentativas. Abortando."
    exit 1
  fi

  echo "Migrate falhou, retry ${attempts}/${max_attempts} em 3s..."
  sleep 3
done

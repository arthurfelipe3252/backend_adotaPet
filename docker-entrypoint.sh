#!/bin/sh
set -e

# Aplica migrations Drizzle antes de subir o app. Retry porque DB externo
# (Neon/Supabase) pode ter cold start na 1ª conexão do dia.
attempts=0
max_attempts=10

echo "==> Aplicando migrations Drizzle (db:migrate)..."
until npx drizzle-kit migrate; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge "$max_attempts" ]; then
    echo "ERRO: migrations falharam após ${max_attempts} tentativas. Abortando."
    exit 1
  fi
  echo "Migrate falhou, retry ${attempts}/${max_attempts} em 3s..."
  sleep 3
done

echo "==> Migrations aplicadas. Iniciando NestJS..."
exec node dist/main.js

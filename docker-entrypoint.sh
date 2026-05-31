#!/bin/sh
set -e

# Aplica migrations Drizzle antes de subir o app. Retry porque DB externo
# (Neon/Supabase) pode ter cold start na 1ª conexão do dia.
attempts=0
max_attempts=10

echo "==> Aplicando migrations Drizzle (drizzle-kit migrate)..."

while [ "$attempts" -lt "$max_attempts" ]; do
  attempts=$((attempts + 1))

  # Captura stdout+stderr para arquivo temporário e também imprime na tela.
  # Sem isso, o spinner interativo do drizzle-kit (\r) sobrescreve a linha
  # de erro e nunca vemos a causa real da falha.
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

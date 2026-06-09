# syntax=docker/dockerfile:1.7

# ---------- Stage 1: builder ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Instala TODAS as deps (inclui devDeps: nest-cli p/ build, drizzle-kit p/ migrations).
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json drizzle.config.ts ./
COPY src ./src

RUN npm run build

# ---------- Stage 2: runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# tini = PID 1 limpo (signal handling, reaping de zumbis).
RUN apk add --no-cache tini

# node_modules vem do builder com tudo (precisamos do drizzle-kit em runtime
# pra rodar migrations no entrypoint). Trade-off consciente: imagem ~150 MB
# maior em troca de simplicidade no pipeline.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Migrations Drizzle (.sql + journal). O entrypoint roda
# `npx drizzle-kit migrate` que consome esses arquivos.
COPY --from=builder /app/src/shared/infra/database/drizzle ./src/shared/infra/database/drizzle

# Entrypoint normaliza CRLF (caso script venha de checkout em Windows).
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 3000

# Healthcheck nativo do Docker bate em /api/v1/health (registrado no AppModule).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]

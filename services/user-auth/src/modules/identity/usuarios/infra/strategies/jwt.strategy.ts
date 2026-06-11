// JwtStrategy foi removido na migração para microserviços.
// A verificação de JWT é feita globalmente pelo JwtAuthGuard em shared/src/infra/auth/jwt.guard.ts.
// O token é verificado estaticamente (sem query ao banco) usando JWT_SECRET compartilhado.
export {};

/**
 * Metadados opcionais que o controller passa pro AuthService no login/refresh.
 * Usado pra auditoria do refresh token (rastrear de qual dispositivo/IP veio).
 */
export interface LoginMeta {
  userAgent?: string;
  ipAddress?: string;
}

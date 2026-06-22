/**
 * Converte uma duração tipo "1d", "15m", "7d", "3600s", "30000ms"
 * para o equivalente em segundos.
 *
 * Suporta os formatos mais comuns que `@nestjs/jwt` e `ms` aceitam:
 * - ms (milissegundos)
 * - s (segundos)
 * - m (minutos)
 * - h (horas)
 * - d (dias)
 * - w (semanas)
 *
 * Se a entrada já for um número puro (ex: "3600"), retorna como segundos.
 *
 * Lança Error se o formato for inválido — não é DomainException porque
 * isso indica configuração errada do .env, não regra de negócio violada.
 */
export function paraSegundos(duracao: string): number {
  if (/^\d+$/.test(duracao)) {
    return Number(duracao);
  }

  const match = /^(\d+)\s*(ms|s|m|h|d|w)$/.exec(duracao);
  if (!match) {
    throw new Error(
      `Duração inválida: "${duracao}". Use formatos como "15m", "1d", "7d".`,
    );
  }

  const valor = Number(match[1]);
  const unidade = match[2];

  switch (unidade) {
    case 'ms':
      return Math.floor(valor / 1000);
    case 's':
      return valor;
    case 'm':
      return valor * 60;
    case 'h':
      return valor * 3600;
    case 'd':
      return valor * 86400;
    case 'w':
      return valor * 604800;
    default:
      throw new Error(`Unidade desconhecida: "${unidade}"`);
  }
}

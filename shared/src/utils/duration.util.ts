export function paraSegundos(duracao: string): number {
  if (/^\d+$/.test(duracao)) {
    return Number(duracao);
  }

  const match = /^(\d+)\s*(ms|s|m|h|d|w)$/.exec(duracao);
  if (!match) {
    throw new Error(`Duração inválida: "${duracao}". Use formatos como "15m", "1d", "7d".`);
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

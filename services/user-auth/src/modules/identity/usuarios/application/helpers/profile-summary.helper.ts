import type {
  AdotanteRepository,
  AdotanteSummary,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import type {
  ProtetorOngRepository,
  ProtetorOngSummary,
} from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';

/**
 * Helpers de batch lookup de summaries (id + nome) de adotantes e
 * protetores/ONGs. Servem pra enriquecer responses de outros bounded
 * contexts (adoptions, pets, chat) sem cair em N+1.
 *
 * Uso típico em lista:
 *
 *   const adopters = await buildAdotanteSummaryMap(
 *     this.adotanteRepository,
 *     entities.map(e => e.adopterId),
 *   );
 *   return entities.map(e => ({
 *     ...
 *     adopter: adopters.get(e.adopterId) ?? null,
 *   }));
 *
 * Em single, use as funções `fetch*` que retornam o summary direto.
 */

export async function buildAdotanteSummaryMap(
  repo: AdotanteRepository,
  ids: Array<string | null | undefined>,
): Promise<Map<string, AdotanteSummary>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map();
  const summaries = await repo.findSummariesByIds(unique);
  return new Map(summaries.map((s) => [s.id, s]));
}

export async function buildProtetorSummaryMap(
  repo: ProtetorOngRepository,
  ids: Array<string | null | undefined>,
): Promise<Map<string, ProtetorOngSummary>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map();
  const summaries = await repo.findSummariesByIds(unique);
  return new Map(summaries.map((s) => [s.id, s]));
}

export async function fetchAdotanteSummary(
  repo: AdotanteRepository,
  id: string | null | undefined,
): Promise<AdotanteSummary | null> {
  if (!id) return null;
  const [summary] = await repo.findSummariesByIds([id]);
  return summary ?? null;
}

export async function fetchProtetorSummary(
  repo: ProtetorOngRepository,
  id: string | null | undefined,
): Promise<ProtetorOngSummary | null> {
  if (!id) return null;
  const [summary] = await repo.findSummariesByIds([id]);
  return summary ?? null;
}

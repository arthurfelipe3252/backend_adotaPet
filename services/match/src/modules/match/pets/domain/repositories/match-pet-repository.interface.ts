import type { CatalogPetPayload } from '@shared/contracts/events/catalog-events.enum';
import type { MatchPetRow } from '@match/pets/infra/schemas/match-pet.schema';

export const MATCH_PET_REPOSITORY = Symbol('MATCH_PET_REPOSITORY');

/**
 * Contrato da réplica local de pets no serviço de match.
 * Alimentada por eventos do catalog; lida pelo cálculo de match.
 */
export interface MatchPetRepository {
  /** Insere ou atualiza a partir do payload do evento (pet.created/updated). */
  upsert(pet: CatalogPetPayload): Promise<void>;
  /** Remove a réplica (pet.deleted). */
  deleteById(id: string): Promise<void>;
  /** Pets disponíveis pra adoção — entrada do ranking de match. */
  findAvailable(): Promise<MatchPetRow[]>;
}

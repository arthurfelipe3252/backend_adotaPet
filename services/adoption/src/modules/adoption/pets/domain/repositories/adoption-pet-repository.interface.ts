import type { CatalogPetPayload } from '@shared/contracts/events/catalog-events.enum';

export const ADOPTION_PET_REPOSITORY = Symbol('ADOPTION_PET_REPOSITORY');

/**
 * Réplica local de pets no serviço de adoção. Alimentada por eventos do catalog;
 * usada pra resolver o `protetorId` (= protetores_ongs.id) de um pet na criação
 * da solicitação de adoção.
 */
export interface AdoptionPetRepository {
  upsert(pet: CatalogPetPayload): Promise<void>;
  deleteById(id: string): Promise<void>;
  findProtetorIdByPetId(petId: string): Promise<string | null>;
}

export enum CatalogExchangeName {
  PET_CREATED = 'catalog.pets.created.exchange',
  PET_UPDATED = 'catalog.pets.updated.exchange',
  PET_DELETED = 'catalog.pets.deleted.exchange',
}

export enum CatalogRoutingKey {
  PET_CREATED = 'pet.created',
  PET_UPDATED = 'pet.updated',
  PET_DELETED = 'pet.deleted',
}

/**
 * Payload completo publicado em pet.created/pet.updated. É o contrato entre o
 * catalog (publisher) e os consumidores (reports, match) — evita o drift que
 * acontecia quando cada lado assumia um shape inline. pet.deleted manda só { id }.
 *
 * createdAt/updatedAt são ISO strings (serialização JSON do evento).
 */
export interface CatalogPetPayload {
  id: string;
  protetorId: string;
  nome: string;
  especie: string;
  raca: string | null;
  porte: string;
  sexo: string;
  idadeMeses: number;
  castrado: boolean;
  vacinado: boolean;
  temperamento: string | null;
  status: string;
  fotosUrls: string[];
  createdAt: string;
  updatedAt: string;
}

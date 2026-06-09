import type { PaginationParams } from '@shared/infra/hateoas';
import type { Pet, Especie, Porte, PetStatus } from '../models/pet.entity';

export const PET_REPOSITORY = Symbol('PET_REPOSITORY');

export interface PetFilters {
  especie?: Especie;
  porte?: Porte;
  status?: PetStatus;
  castrado?: boolean;
  protetorId?: string;
}

export interface PetRepository {
  create(pet: Pet): Promise<Pet>;
  update(pet: Pet): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(filters?: PetFilters): Promise<Pet[]>;
  findAllPaginated(params: PaginationParams, filters?: PetFilters): Promise<{ rows: Pet[]; total: number }>;
  findById(id: string): Promise<Pet | null>;
  findByProtetor(protetorId: string): Promise<Pet[]>;
}

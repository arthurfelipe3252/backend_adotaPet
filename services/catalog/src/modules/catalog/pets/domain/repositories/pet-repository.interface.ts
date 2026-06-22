import { Pet, Especie, Porte, PetStatus } from '../models/pet.entity';

export const PET_REPOSITORY = Symbol('PET_REPOSITORY');

export interface PetFilters {
  especie?: Especie;
  porte?: Porte;
  status?: PetStatus;
  castrado?: boolean;
  protetorId?: string;
  limit?: number;
  offset?: number;
}

export interface PetRepository {
  create(pet: Pet): Promise<Pet>;
  update(pet: Pet): Promise<void>;
  delete(id: string): Promise<void>;
  /** Lista paginada: `rows` já fatiada por limit/offset; `total` é a contagem completa do filtro. */
  findAll(filters?: PetFilters): Promise<{ rows: Pet[]; total: number }>;
  findById(id: string): Promise<Pet | null>;
  findByProtetor(protetorId: string): Promise<Pet[]>;
}

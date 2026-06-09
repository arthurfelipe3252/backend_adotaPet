import type { PaginationParams } from '@shared/infra/hateoas';
import type { Adotante } from '../models/adotante.entity';

export const ADOTANTE_REPOSITORY = Symbol('ADOTANTE_REPOSITORY');

export interface AdotanteRepository {
  create(adotante: Adotante): Promise<void>;
  update(adotante: Adotante): Promise<void>;
  findAll(): Promise<Adotante[]>;
  findAllPaginated(params: PaginationParams): Promise<{ rows: Adotante[]; total: number }>;
  findById(id: string): Promise<Adotante | null>;
  findByUsuarioId(usuarioId: string): Promise<Adotante | null>;
}

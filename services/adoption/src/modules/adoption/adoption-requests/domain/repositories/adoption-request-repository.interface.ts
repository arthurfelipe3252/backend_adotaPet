import type { PaginationParams } from '@shared/infra/hateoas';
import type { AdoptionRequest } from '../models/adoption-request.entity';

export const ADOPTION_REQUEST_REPOSITORY = Symbol('ADOPTION_REQUEST_REPOSITORY');

export interface AdoptionRequestRepository {
  create(request: AdoptionRequest): Promise<void>;
  update(request: AdoptionRequest): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<AdoptionRequest[]>;
  findAllPaginated(params: PaginationParams): Promise<{ rows: AdoptionRequest[]; total: number }>;
  findById(id: string): Promise<AdoptionRequest | null>;
  findByAdopterId(adopterId: string): Promise<AdoptionRequest[]>;
  findByProtetorId(protetorId: string): Promise<AdoptionRequest[]>;
}

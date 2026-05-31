import { AdoptionRequest } from '@adoption/adoption-requests/domain/models/adoption-request.entity';

export const ADOPTION_REQUEST_REPOSITORY = Symbol(
  'ADOPTION_REQUEST_REPOSITORY',
);

export interface AdoptionRequestRepository {
  create(request: AdoptionRequest): Promise<void>;
  update(request: AdoptionRequest): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<AdoptionRequest[]>;
  findById(id: string): Promise<AdoptionRequest | null>;
}

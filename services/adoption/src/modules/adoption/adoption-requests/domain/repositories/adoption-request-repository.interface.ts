import { AdoptionRequest } from '@adoption/adoption-requests/domain/models/adoption-request.entity';

export const ADOPTION_REQUEST_REPOSITORY = Symbol(
  'ADOPTION_REQUEST_REPOSITORY',
);

export interface AdoptionRequestFilters {
  adopterId?: string;
  protetorId?: string;
}

export interface AdoptionRequestRepository {
  /**
   * Insere a solicitação e retorna a entidade reidratada com o `id`
   * gerado pelo banco. Usar o RETORNO no service — a entidade
   * passada como parâmetro ainda tem `id === undefined`.
   */
  create(request: AdoptionRequest): Promise<AdoptionRequest>;
  update(request: AdoptionRequest): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(filters?: AdoptionRequestFilters): Promise<AdoptionRequest[]>;
  findById(id: string): Promise<AdoptionRequest | null>;
}

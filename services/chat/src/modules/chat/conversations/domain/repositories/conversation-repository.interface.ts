import type { PaginationParams } from '@shared/infra/hateoas';
import type { Conversation } from '../models/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface ConversationRepository {
  create(conversation: Conversation): Promise<void>;
  update(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findAllPaginated(params: PaginationParams): Promise<{ rows: Conversation[]; total: number }>;
  findByAdoptionRequestId(adoptionRequestId: string): Promise<Conversation | null>;
  findByParticipant(params: { adopterId?: string; protetorId?: string }): Promise<Conversation[]>;
}

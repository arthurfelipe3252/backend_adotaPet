import { Conversation } from '@chat/conversations/domain/models/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface ConversationRepository {
  create(conversation: Conversation): Promise<void>;
  update(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findByAdoptionRequestId(
    adoptionRequestId: string,
  ): Promise<Conversation | null>;
  findByParticipant(params: {
    adopterId?: string;
    protetorId?: string;
  }): Promise<Conversation[]>;
}

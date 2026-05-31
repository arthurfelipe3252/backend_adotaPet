import { Conversation } from '@chat/conversations/domain/models/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface ConversationRepository {
  /**
   * Insere e retorna a entidade reidratada com o `id` gerado pelo
   * banco. A entidade passada como parâmetro continua com `id` ausente.
   */
  create(conversation: Conversation): Promise<Conversation>;
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

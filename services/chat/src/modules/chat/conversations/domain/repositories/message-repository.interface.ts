import { Message } from '@chat/conversations/domain/models/message.entity';

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');

export interface MessageRepository {
  /**
   * Insere e retorna a entidade reidratada com o `id` gerado pelo
   * banco. A entidade passada como parâmetro continua sem `id`.
   */
  create(message: Message): Promise<Message>;
  update(message: Message): Promise<void>;
  findById(id: string): Promise<Message | null>;
  findByConversation(params: {
    conversationId: string;
    limit?: number;
    offset?: number;
  }): Promise<Message[]>;
}

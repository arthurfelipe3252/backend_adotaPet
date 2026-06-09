import type { Message } from '../models/message.entity';

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');

export interface MessageRepository {
  create(message: Message): Promise<void>;
  update(message: Message): Promise<void>;
  findById(id: string): Promise<Message | null>;
  findByConversation(params: { conversationId: string; limit?: number; offset?: number }): Promise<Message[]>;
}

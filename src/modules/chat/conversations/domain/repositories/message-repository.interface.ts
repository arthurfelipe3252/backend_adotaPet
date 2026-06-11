import { Message } from '@chat/conversations/domain/models/message.entity';

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');

/**
 * Projeção da última mensagem de uma conversa — usada na listagem pra
 * preview/ordenação, sem precisar reidratar a entidade completa.
 */
export interface LastMessageProjection {
  content: string;
  senderId: string;
  createdAt: Date;
}

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

  /**
   * Conta mensagens não-lidas de cada conversa, do ponto de vista do
   * participante (`sender_id != viewerProfileId AND is_read = false`).
   * Batch — uma query para todas. Conversas sem unread não aparecem
   * no map (caller deve usar default 0).
   */
  countUnreadByConversationForViewer(params: {
    conversationIds: string[];
    viewerProfileId: string;
  }): Promise<Map<string, number>>;

  /**
   * Última mensagem de cada conversa (DISTINCT ON), em batch.
   * Conversas sem mensagens não aparecem no map.
   */
  findLastMessageByConversation(
    conversationIds: string[],
  ): Promise<Map<string, LastMessageProjection>>;

  /**
   * Marca como lidas todas as mensagens não-lidas recebidas pelo viewer
   * (sender_id != viewerProfileId). Retorna o número de mensagens
   * afetadas.
   */
  markAllAsReadInConversation(params: {
    conversationId: string;
    viewerProfileId: string;
  }): Promise<number>;
}

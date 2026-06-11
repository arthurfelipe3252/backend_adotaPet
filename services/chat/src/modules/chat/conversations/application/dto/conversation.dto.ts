import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  adoptionRequestId!: string;

  @IsOptional()
  @IsUUID()
  protetorId?: string;
}

export class UpdateConversationActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export interface ProfileSummary {
  id: string;
  nome: string;
}

/**
 * Resumo da última mensagem da conversa — usado pra preview na lista
 * e pra ordenação por última atividade. `senderTipo` é derivado
 * comparando o `sender_id` com o adopterId/protetorId da conversa.
 */
export interface LastMessageSummary {
  content: string;
  createdAt: Date;
  senderTipo: 'adotante' | 'protetor';
}

export class MarkAllAsReadResponseDto {
  /** Quantidade de mensagens marcadas como lidas nessa chamada. */
  markedAsRead!: number;
}

export class ConversationResponseDto {
  id!: string;
  adoptionRequestId!: string;
  adopterId!: string;
  protetorId!: string;
  /**
   * Summary (id + nome) dos participantes — populados pelo service via
   * batch lookup. Nulos se o perfil foi excluído.
   */
  adopter!: ProfileSummary | null;
  protetor!: ProfileSummary | null;
  isActive!: boolean;
  /**
   * Mensagens não-lidas do ponto de vista do usuário autenticado
   * (apenas as enviadas pelo OUTRO participante). 0 quando tudo lido.
   */
  unreadCount!: number;
  /**
   * Última mensagem da conversa — null se nenhuma mensagem ainda.
   * Usado pelo front pra preview na lista e ordenação.
   */
  lastMessage!: LastMessageSummary | null;
  createdAt!: Date;
  updatedAt!: Date;
}

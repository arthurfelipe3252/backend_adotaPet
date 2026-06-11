import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '@chat/conversations/domain/repositories/conversation-repository.interface';
import {
  ConversationResponseDto,
  CreateConversationDto,
  LastMessageSummary,
  MarkAllAsReadResponseDto,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';
import {
  MESSAGE_REPOSITORY,
  type LastMessageProjection,
  type MessageRepository,
} from '@chat/conversations/domain/repositories/message-repository.interface';
import { ChatMessagingService } from '@chat/conversations/infra/messaging/chat-messaging.service';

interface JwtUser {
  sub: string;
  tipoUsuario: string;
}

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly repository: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    private readonly chatMessaging: ChatMessagingService,
  ) {}

  async create(user: JwtUser, dto: CreateConversationDto): Promise<ConversationResponseDto> {
    const existing = await this.repository.findByAdoptionRequestId(dto.adoptionRequestId);
    if (existing) return this.toResponseSingle(existing, user.sub);

    const conversation = Conversation.create({
      adoptionRequestId: dto.adoptionRequestId,
      adopterId: user.sub,
      protetorId: dto.protetorId ?? '',
      isActive: true,
    });

    const created = await this.repository.create(conversation);
    await this.chatMessaging.publishConversationCreated({
      id: created.id!,
      adopterId: created.adopterId,
      protetorId: created.protetorId,
      adoptionRequestId: created.adoptionRequestId,
    });
    return this.toResponseSingle(created, user.sub);
  }

  async createInternal(params: {
    adoptionRequestId: string;
    adopterId: string;
    protetorId: string;
  }): Promise<void> {
    const existing = await this.repository.findByAdoptionRequestId(params.adoptionRequestId);
    if (existing) return;

    const conversation = Conversation.create({
      adoptionRequestId: params.adoptionRequestId,
      adopterId: params.adopterId,
      protetorId: params.protetorId,
      isActive: true,
    });

    const created = await this.repository.create(conversation);
    await this.chatMessaging.publishConversationCreated({
      id: created.id!,
      adopterId: created.adopterId,
      protetorId: created.protetorId,
      adoptionRequestId: created.adoptionRequestId,
    });
  }

  async findAll(user: JwtUser): Promise<ConversationResponseDto[]> {
    const isAdotante = user.tipoUsuario === 'adotante';
    const conversations = isAdotante
      ? await this.repository.findByParticipant({ adopterId: user.sub })
      : await this.repository.findByParticipant({ protetorId: user.sub });

    return this.toResponseBatch(conversations, user.sub);
  }

  async findById(id: string, user: JwtUser): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    if (conversation.adopterId !== user.sub && conversation.protetorId !== user.sub) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }
    return this.toResponseSingle(conversation, user.sub);
  }

  async updateStatus(
    id: string,
    user: JwtUser,
    dto: UpdateConversationActiveDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    if (conversation.adopterId !== user.sub && conversation.protetorId !== user.sub) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    conversation.withActive(dto.isActive).touch(new Date());
    await this.repository.update(conversation);
    return this.toResponseSingle(conversation, user.sub);
  }

  async markAllAsRead(id: string, user: JwtUser): Promise<MarkAllAsReadResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    if (conversation.adopterId !== user.sub && conversation.protetorId !== user.sub) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    const markedAsRead = await this.messageRepository.markAllAsReadInConversation({
      conversationId: id,
      viewerProfileId: user.sub,
    });

    return { markedAsRead };
  }

  private async toResponseBatch(
    conversations: Conversation[],
    viewerProfileId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversationIds = conversations.map((c) => c.id).filter((id): id is string => !!id);

    const [unreadCounts, lastMessages] = await Promise.all([
      this.messageRepository.countUnreadByConversationForViewer({
        conversationIds,
        viewerProfileId,
      }),
      this.messageRepository.findLastMessageByConversation(conversationIds),
    ]);

    const responses = conversations.map((c) =>
      this.mapToResponse(
        c,
        c.id ? (unreadCounts.get(c.id) ?? 0) : 0,
        c.id ? (lastMessages.get(c.id) ?? null) : null,
      ),
    );

    return responses.sort((a, b) => {
      const aTime = (a.lastMessage?.createdAt ?? a.updatedAt).getTime();
      const bTime = (b.lastMessage?.createdAt ?? b.updatedAt).getTime();
      return bTime - aTime;
    });
  }

  private async toResponseSingle(
    conversation: Conversation,
    viewerProfileId: string,
  ): Promise<ConversationResponseDto> {
    const conversationIds = conversation.id ? [conversation.id] : [];
    const [unreadCounts, lastMessages] = await Promise.all([
      this.messageRepository.countUnreadByConversationForViewer({
        conversationIds,
        viewerProfileId,
      }),
      this.messageRepository.findLastMessageByConversation(conversationIds),
    ]);

    const unread = conversation.id ? (unreadCounts.get(conversation.id) ?? 0) : 0;
    const lastMessage = conversation.id ? (lastMessages.get(conversation.id) ?? null) : null;

    return this.mapToResponse(conversation, unread, lastMessage);
  }

  private mapToResponse(
    conversation: Conversation,
    unreadCount: number,
    lastMessage: LastMessageProjection | null,
  ): ConversationResponseDto {
    return {
      id: conversation.id ?? '',
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      adopter: null,
      protetor: null,
      isActive: conversation.isActive,
      unreadCount,
      lastMessage: this.toLastMessageSummary(lastMessage, conversation),
      createdAt: conversation.createdAt ?? new Date(),
      updatedAt: conversation.updatedAt ?? new Date(),
    };
  }

  private toLastMessageSummary(
    lastMessage: LastMessageProjection | null,
    conversation: Conversation,
  ): LastMessageSummary | null {
    if (!lastMessage) return null;
    return {
      content: lastMessage.content,
      createdAt: lastMessage.createdAt,
      senderTipo: lastMessage.senderId === conversation.adopterId ? 'adotante' : 'protetor',
    };
  }
}

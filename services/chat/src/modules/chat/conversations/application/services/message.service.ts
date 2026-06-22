import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateMessageDto,
  ListMessagesQueryDto,
  MessageResponseDto,
  SenderSummary,
  UpdateMessageReadDto,
} from '@chat/conversations/application/dto/message.dto';
import { Message } from '@chat/conversations/domain/models/message.entity';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '@chat/conversations/domain/repositories/message-repository.interface';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '@chat/conversations/domain/repositories/conversation-repository.interface';
import { ChatMessagingService } from '@chat/conversations/infra/messaging/chat-messaging.service';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
  type ProfileView,
} from '@chat/profiles/domain/repositories/profile-repository.interface';

interface JwtUser {
  sub: string;
  adotanteId?: string;
  protetorId?: string;
  tipoUsuario: string;
}

/** Id de PERFIL do usuário (adotantes.id ou protetores_ongs.id) — vindo do JWT. */
function profileId(user: JwtUser): string {
  return (user.tipoUsuario === 'adotante' ? user.adotanteId : user.protetorId) ?? '';
}

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
    private readonly chatMessaging: ChatMessagingService,
  ) {}

  async create(
    conversationId: string,
    user: JwtUser,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const viewerId = profileId(user);
    if (conversation.adopterId !== viewerId && conversation.protetorId !== viewerId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    const message = Message.create({
      conversationId,
      senderId: profileId(user),
      content: dto.content,
      isRead: false,
    });

    const created = await this.messageRepository.create(message);
    conversation.touch(new Date());
    await this.conversationRepository.update(conversation);
    await this.chatMessaging.publishMessageCreated({
      id: created.id!,
      conversationId: created.conversationId,
      senderId: created.senderId,
      isRead: created.isRead,
    });
    const profile = await this.profileRepository.findById(created.senderId);
    return this.mapToResponse(created, conversation, profile);
  }

  async findByConversation(
    conversationId: string,
    user: JwtUser,
    query: ListMessagesQueryDto,
  ): Promise<MessageResponseDto[]> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const viewerId = profileId(user);
    if (conversation.adopterId !== viewerId && conversation.protetorId !== viewerId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    const messages = await this.messageRepository.findByConversation({
      conversationId,
      limit: query.limit,
      offset: query.offset,
    });

    // Só dois perfis possíveis numa conversa (adotante + protetor) — 1 batch lookup.
    const profiles = await this.profileRepository.findByIds(
      [...new Set([conversation.adopterId, conversation.protetorId].filter(Boolean))],
    );

    return messages.map((m) =>
      this.mapToResponse(m, conversation, profiles.get(m.senderId) ?? null),
    );
  }

  async updateReadStatus(
    id: string,
    user: JwtUser,
    dto: UpdateMessageReadDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(id);
    if (!message) throw new NotFoundException('Mensagem não encontrada');

    const conversation = await this.conversationRepository.findById(message.conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const viewerId = profileId(user);
    if (conversation.adopterId !== viewerId && conversation.protetorId !== viewerId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    message.withRead(dto.isRead).touch(new Date());
    await this.messageRepository.update(message);
    const profile = await this.profileRepository.findById(message.senderId);
    return this.mapToResponse(message, conversation, profile);
  }

  private mapToResponse(
    message: Message,
    conversation: Conversation,
    profile: ProfileView | null,
  ): MessageResponseDto {
    return {
      id: message.id ?? '',
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: this.toSender(message.senderId, conversation, profile),
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt ?? new Date(),
      updatedAt: message.updatedAt ?? new Date(),
    };
  }

  /**
   * Resumo do remetente. `nome` vem da réplica de perfis; `tipo` é derivado
   * pela posição na conversa (igual ao senderTipo da última mensagem), o que
   * garante o discriminador 'adotante' | 'protetor'. Null se o perfil sumiu.
   */
  private toSender(
    senderId: string,
    conversation: Conversation,
    profile: ProfileView | null,
  ): SenderSummary | null {
    if (!profile) return null;
    return {
      id: profile.id,
      nome: profile.nome,
      tipo: senderId === conversation.adopterId ? 'adotante' : 'protetor',
    };
  }
}

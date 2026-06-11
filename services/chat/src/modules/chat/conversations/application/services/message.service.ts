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
  UpdateMessageReadDto,
} from '@chat/conversations/application/dto/message.dto';
import { Message } from '@chat/conversations/domain/models/message.entity';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '@chat/conversations/domain/repositories/message-repository.interface';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '@chat/conversations/domain/repositories/conversation-repository.interface';
import { ChatMessagingService } from '@chat/conversations/infra/messaging/chat-messaging.service';

interface JwtUser {
  sub: string;
  tipoUsuario: string;
}

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
    private readonly chatMessaging: ChatMessagingService,
  ) {}

  async create(
    conversationId: string,
    user: JwtUser,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    if (conversation.adopterId !== user.sub && conversation.protetorId !== user.sub) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    const message = Message.create({
      conversationId,
      senderId: user.sub,
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
    return this.mapToResponse(created);
  }

  async findByConversation(
    conversationId: string,
    user: JwtUser,
    query: ListMessagesQueryDto,
  ): Promise<MessageResponseDto[]> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    if (conversation.adopterId !== user.sub && conversation.protetorId !== user.sub) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    const messages = await this.messageRepository.findByConversation({
      conversationId,
      limit: query.limit,
      offset: query.offset,
    });

    return messages.map((m) => this.mapToResponse(m));
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
    if (conversation.adopterId !== user.sub && conversation.protetorId !== user.sub) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    message.withRead(dto.isRead).touch(new Date());
    await this.messageRepository.update(message);
    return this.mapToResponse(message);
  }

  private mapToResponse(message: Message): MessageResponseDto {
    return {
      id: message.id ?? '',
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: null,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt ?? new Date(),
      updatedAt: message.updatedAt ?? new Date(),
    };
  }
}

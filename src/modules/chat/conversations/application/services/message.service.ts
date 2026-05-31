import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
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

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async create(
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa nao encontrada');

    const isParticipant =
      dto.senderId === conversation.adopterId ||
      dto.senderId === conversation.protetorId;
    if (!isParticipant) {
      throw new BadRequestException('Remetente nao pertence a conversa');
    }

    const message = Message.create({
      conversationId,
      senderId: dto.senderId,
      content: dto.content,
      isRead: false,
    });

    await this.messageRepository.create(message);
    conversation.touch(new Date());
    await this.conversationRepository.update(conversation);

    return this.toResponse(message);
  }

  async findByConversation(
    conversationId: string,
    query: ListMessagesQueryDto,
  ): Promise<MessageResponseDto[]> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa nao encontrada');

    const messages = await this.messageRepository.findByConversation({
      conversationId,
      limit: query.limit,
      offset: query.offset,
    });

    return messages.map((message) => this.toResponse(message));
  }

  async updateReadStatus(
    id: string,
    dto: UpdateMessageReadDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(id);
    if (!message) throw new NotFoundException('Mensagem nao encontrada');

    message.withRead(dto.isRead).touch(new Date());
    await this.messageRepository.update(message);

    return this.toResponse(message);
  }

  private toResponse(message: Message): MessageResponseDto {
    return {
      id: message.id ?? '',
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt ?? new Date(),
      updatedAt: message.updatedAt ?? new Date(),
    };
  }
}

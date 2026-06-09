import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Message } from '@chat/conversations/domain/models/message.entity';
import { CONVERSATION_REPOSITORY, type ConversationRepository } from '@chat/conversations/domain/repositories/conversation-repository.interface';
import { MESSAGE_REPOSITORY, type MessageRepository } from '@chat/conversations/domain/repositories/message-repository.interface';
import { MessageResponseDto, type CreateMessageDto, type ListMessagesQueryDto, type UpdateMessageReadDto } from '../dto/message.dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepository,
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepository: ConversationRepository,
  ) {}

  async create(conversationId: string, dto: CreateMessageDto): Promise<MessageResponseDto> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const isParticipant = dto.senderId === conversation.adopterId || dto.senderId === conversation.protetorId;
    if (!isParticipant) throw new BadRequestException('Remetente não pertence à conversa');
    const message = Message.create({ conversationId, senderId: dto.senderId, content: dto.content, isRead: false });
    await this.messageRepository.create(message);
    conversation.touch(new Date());
    await this.conversationRepository.update(conversation);
    return MessageResponseDto.fromMessage(message)!;
  }

  async findByConversation(conversationId: string, query: ListMessagesQueryDto): Promise<MessageResponseDto[]> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const messages = await this.messageRepository.findByConversation({ conversationId, limit: query.limit, offset: query.offset });
    return messages.map((m) => MessageResponseDto.fromMessage(m)!);
  }

  async updateReadStatus(id: string, dto: UpdateMessageReadDto): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(id);
    if (!message) throw new NotFoundException('Mensagem não encontrada');
    message.withRead(dto.isRead).touch(new Date());
    await this.messageRepository.update(message);
    return MessageResponseDto.fromMessage(message)!;
  }
}

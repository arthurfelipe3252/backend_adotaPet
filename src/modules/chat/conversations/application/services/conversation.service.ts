import {
  BadRequestException,
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
  ListConversationsQueryDto,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly repository: ConversationRepository,
  ) {}

  async create(dto: CreateConversationDto): Promise<ConversationResponseDto> {
    const existing = await this.repository.findByAdoptionRequestId(
      dto.adoptionRequestId,
    );
    if (existing) return this.toResponse(existing);

    const conversation = Conversation.create({
      adoptionRequestId: dto.adoptionRequestId,
      adopterId: dto.adopterId,
      protetorId: dto.protetorId,
      isActive: true,
    });

    await this.repository.create(conversation);
    return this.toResponse(conversation);
  }

  async findAll(
    query: ListConversationsQueryDto,
  ): Promise<ConversationResponseDto[]> {
    if (!query.adopterId && !query.protetorId) {
      throw new BadRequestException('Informe adopterId ou protetorId');
    }

    const conversations = await this.repository.findByParticipant({
      adopterId: query.adopterId,
      protetorId: query.protetorId,
    });

    return conversations.map((conversation) => this.toResponse(conversation));
  }

  async findById(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa nao encontrada');
    return this.toResponse(conversation);
  }

  async updateStatus(
    id: string,
    dto: UpdateConversationActiveDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa nao encontrada');

    conversation.withActive(dto.isActive).touch(new Date());
    await this.repository.update(conversation);

    return this.toResponse(conversation);
  }

  private toResponse(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id ?? '',
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt ?? new Date(),
      updatedAt: conversation.updatedAt ?? new Date(),
    };
  }
}

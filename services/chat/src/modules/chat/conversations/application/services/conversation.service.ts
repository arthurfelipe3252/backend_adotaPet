import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';
import { CONVERSATION_REPOSITORY, type ConversationRepository } from '@chat/conversations/domain/repositories/conversation-repository.interface';
import { ConversationResponseDto, type CreateConversationDto, type ListConversationsQueryDto, type UpdateConversationActiveDto } from '../dto/conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly repository: ConversationRepository,
  ) {}

  async create(dto: CreateConversationDto): Promise<ConversationResponseDto> {
    const existing = await this.repository.findByAdoptionRequestId(dto.adoptionRequestId);
    if (existing) return ConversationResponseDto.fromConversation(existing)!;
    const conversation = Conversation.create({ adoptionRequestId: dto.adoptionRequestId, adopterId: dto.adopterId, protetorId: dto.protetorId, isActive: true });
    await this.repository.create(conversation);
    return ConversationResponseDto.fromConversation(conversation)!;
  }

  async listPaginated(params: PaginationParams): Promise<{ rows: ConversationResponseDto[]; total: number }> {
    const result = await this.repository.findAllPaginated(params);
    return { rows: result.rows.map((c) => ConversationResponseDto.fromConversation(c)!), total: result.total };
  }

  async findAll(query: ListConversationsQueryDto): Promise<ConversationResponseDto[]> {
    if (!query.adopterId && !query.protetorId) throw new BadRequestException('Informe adopterId ou protetorId');
    const conversations = await this.repository.findByParticipant({ adopterId: query.adopterId, protetorId: query.protetorId });
    return conversations.map((c) => ConversationResponseDto.fromConversation(c)!);
  }

  async findById(id: string): Promise<ConversationResponseDto> {
    const conv = await this.repository.findById(id);
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    return ConversationResponseDto.fromConversation(conv)!;
  }

  async updateStatus(id: string, dto: UpdateConversationActiveDto): Promise<ConversationResponseDto> {
    const conv = await this.repository.findById(id);
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    conv.withActive(dto.isActive).touch(new Date());
    await this.repository.update(conv);
    return ConversationResponseDto.fromConversation(conv)!;
  }
}

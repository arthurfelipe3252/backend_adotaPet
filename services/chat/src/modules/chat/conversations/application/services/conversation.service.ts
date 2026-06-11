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
import type {
  ConversationResponseDto,
  CreateConversationDto,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';
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
    private readonly chatMessaging: ChatMessagingService,
  ) {}

  async create(user: JwtUser, dto: CreateConversationDto): Promise<ConversationResponseDto> {
    const existing = await this.repository.findByAdoptionRequestId(dto.adoptionRequestId);
    if (existing) return this.mapToResponse(existing);

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
    return this.mapToResponse(created);
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

    return conversations.map((c) => this.mapToResponse(c));
  }

  async findById(id: string, user: JwtUser): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    if (conversation.adopterId !== user.sub && conversation.protetorId !== user.sub) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }
    return this.mapToResponse(conversation);
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
    return this.mapToResponse(conversation);
  }

  private mapToResponse(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id ?? '',
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      adopter: null,
      protetor: null,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt ?? new Date(),
      updatedAt: conversation.updatedAt ?? new Date(),
    };
  }
}

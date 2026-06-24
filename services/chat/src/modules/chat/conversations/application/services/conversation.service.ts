import {
  BadRequestException,
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
  ProfileSummary,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';
import {
  MESSAGE_REPOSITORY,
  type LastMessageProjection,
  type MessageRepository,
} from '@chat/conversations/domain/repositories/message-repository.interface';
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
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly repository: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
    private readonly chatMessaging: ChatMessagingService,
  ) {}

  async create(user: JwtUser, dto: CreateConversationDto): Promise<ConversationResponseDto> {
    // A conversa é materializada via evento de adoção (createInternal) quando a
    // solicitação entra em análise ou é aprovada — a ÚNICA fonte com adopterId +
    // protetorId corretos. O chat não tem os dados da adoção pra resolver o
    // protetorId aqui. Então este endpoint só devolve a conversa já criada
    // (idempotente) — nunca insere com id vazio.
    const existing = await this.repository.findByAdoptionRequestId(dto.adoptionRequestId);
    if (existing) return this.toResponseSingle(existing, profileId(user));

    throw new BadRequestException(
      'A conversa é criada automaticamente quando a adoção entra em análise ou é aprovada.',
    );
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
      ? await this.repository.findByParticipant({ adopterId: user.adotanteId })
      : await this.repository.findByParticipant({ protetorId: user.protetorId });

    return this.toResponseBatch(conversations, profileId(user));
  }

  async findById(id: string, user: JwtUser): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const viewerId = profileId(user);
    if (conversation.adopterId !== viewerId && conversation.protetorId !== viewerId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }
    return this.toResponseSingle(conversation, viewerId);
  }

  async updateStatus(
    id: string,
    user: JwtUser,
    dto: UpdateConversationActiveDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const viewerId = profileId(user);
    if (conversation.adopterId !== viewerId && conversation.protetorId !== viewerId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    conversation.withActive(dto.isActive).touch(new Date());
    await this.repository.update(conversation);
    return this.toResponseSingle(conversation, viewerId);
  }

  async markAllAsRead(id: string, user: JwtUser): Promise<MarkAllAsReadResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const viewerId = profileId(user);
    if (conversation.adopterId !== viewerId && conversation.protetorId !== viewerId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }

    const markedAsRead = await this.messageRepository.markAllAsReadInConversation({
      conversationId: id,
      viewerProfileId: viewerId,
    });

    return { markedAsRead };
  }

  private async toResponseBatch(
    conversations: Conversation[],
    viewerProfileId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversationIds = conversations.map((c) => c.id).filter((id): id is string => !!id);
    const profileIds = [
      ...new Set(conversations.flatMap((c) => [c.adopterId, c.protetorId]).filter(Boolean)),
    ];

    const [unreadCounts, lastMessages, profiles] = await Promise.all([
      this.messageRepository.countUnreadByConversationForViewer({
        conversationIds,
        viewerProfileId,
      }),
      this.messageRepository.findLastMessageByConversation(conversationIds),
      this.profileRepository.findByIds(profileIds),
    ]);

    const responses = conversations.map((c) =>
      this.mapToResponse(
        c,
        c.id ? (unreadCounts.get(c.id) ?? 0) : 0,
        c.id ? (lastMessages.get(c.id) ?? null) : null,
        profiles,
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
    const profileIds = [...new Set([conversation.adopterId, conversation.protetorId].filter(Boolean))];
    const [unreadCounts, lastMessages, profiles] = await Promise.all([
      this.messageRepository.countUnreadByConversationForViewer({
        conversationIds,
        viewerProfileId,
      }),
      this.messageRepository.findLastMessageByConversation(conversationIds),
      this.profileRepository.findByIds(profileIds),
    ]);

    const unread = conversation.id ? (unreadCounts.get(conversation.id) ?? 0) : 0;
    const lastMessage = conversation.id ? (lastMessages.get(conversation.id) ?? null) : null;

    return this.mapToResponse(conversation, unread, lastMessage, profiles);
  }

  private mapToResponse(
    conversation: Conversation,
    unreadCount: number,
    lastMessage: LastMessageProjection | null,
    profiles: Map<string, ProfileView>,
  ): ConversationResponseDto {
    return {
      id: conversation.id ?? '',
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      adopter: this.toSummary(profiles.get(conversation.adopterId) ?? null),
      protetor: this.toSummary(profiles.get(conversation.protetorId) ?? null),
      isActive: conversation.isActive,
      unreadCount,
      lastMessage: this.toLastMessageSummary(lastMessage, conversation),
      createdAt: conversation.createdAt ?? new Date(),
      updatedAt: conversation.updatedAt ?? new Date(),
    };
  }

  /** Converte a réplica de perfil em resumo {id, nome} pro response. */
  private toSummary(profile: ProfileView | null): ProfileSummary | null {
    if (!profile) return null;
    return { id: profile.id, nome: profile.nome };
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

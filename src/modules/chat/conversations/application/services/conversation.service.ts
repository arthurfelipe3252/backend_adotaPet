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
  ProfileSummary,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';
import {
  MESSAGE_REPOSITORY,
  type LastMessageProjection,
  type MessageRepository,
} from '@chat/conversations/domain/repositories/message-repository.interface';
import {
  ADOPTION_REQUEST_REPOSITORY,
  type AdoptionRequestRepository,
} from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';
import {
  ADOTANTE_REPOSITORY,
  type AdotanteRepository,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import {
  PROTETOR_ONG_REPOSITORY,
  type ProtetorOngRepository,
} from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import {
  resolveAdotanteIdOrFail,
  resolveProtetorIdOrFail,
} from '@identity/usuarios/application/helpers/resolve-profile-id.helper';
import {
  buildAdotanteSummaryMap,
  buildProtetorSummaryMap,
  fetchAdotanteSummary,
  fetchProtetorSummary,
} from '@identity/usuarios/application/helpers/profile-summary.helper';

/**
 * Regras de autorização do contexto @chat/conversations:
 *
 *  - POST /chat/conversations         só participantes da adoption_request
 *                                      podem criar a conversa; adopterId e
 *                                      protetorId são herdados dela
 *  - GET  /chat/conversations         lista só conversas onde o usuário
 *                                      autenticado é participante
 *  - GET  /chat/conversations/:id     ownership: participante
 *  - PATCH /chat/conversations/:id/active  ownership: participante
 *  - PATCH /chat/conversations/:id/read    ownership: participante
 *
 * Responses são enriquecidos com adopter/protetor summary (id + nome),
 * `unreadCount` (do ponto de vista do viewer) e `lastMessage`. Tudo
 * em batch lookups pra evitar N+1.
 */
@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly repository: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(ADOPTION_REQUEST_REPOSITORY)
    private readonly adoptionRequestRepository: AdoptionRequestRepository,
    @Inject(ADOTANTE_REPOSITORY)
    private readonly adotanteRepository: AdotanteRepository,
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorRepository: ProtetorOngRepository,
  ) {}

  async create(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const adoptionRequest = await this.adoptionRequestRepository.findById(
      dto.adoptionRequestId,
    );
    if (!adoptionRequest) {
      throw new NotFoundException('Solicitação de adoção não encontrada');
    }
    if (!adoptionRequest.protetorId) {
      throw new NotFoundException(
        'Solicitação de adoção sem protetor/ong vinculado',
      );
    }

    const viewerProfileId = await this.assertIsParticipant(
      adoptionRequest.adopterId,
      adoptionRequest.protetorId,
      usuarioId,
      tipoUsuario,
    );

    const existing = await this.repository.findByAdoptionRequestId(
      dto.adoptionRequestId,
    );
    if (existing) return this.toResponseSingle(existing, viewerProfileId);

    const conversation = Conversation.create({
      adoptionRequestId: dto.adoptionRequestId,
      adopterId: adoptionRequest.adopterId,
      protetorId: adoptionRequest.protetorId,
      isActive: true,
    });

    const created = await this.repository.create(conversation);
    return this.toResponseSingle(created, viewerProfileId);
  }

  async findAll(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<ConversationResponseDto[]> {
    const viewerProfileId = await this.resolveViewerProfileId(
      usuarioId,
      tipoUsuario,
    );

    const conversations =
      tipoUsuario === TipoUsuario.Adotante
        ? await this.repository.findByParticipant({
            adopterId: viewerProfileId,
          })
        : await this.repository.findByParticipant({
            protetorId: viewerProfileId,
          });

    return this.toResponseBatch(conversations, viewerProfileId);
  }

  async findById(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    const viewerProfileId = await this.assertIsParticipant(
      conversation.adopterId,
      conversation.protetorId,
      usuarioId,
      tipoUsuario,
    );
    return this.toResponseSingle(conversation, viewerProfileId);
  }

  async updateStatus(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: UpdateConversationActiveDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    const viewerProfileId = await this.assertIsParticipant(
      conversation.adopterId,
      conversation.protetorId,
      usuarioId,
      tipoUsuario,
    );

    conversation.withActive(dto.isActive).touch(new Date());
    await this.repository.update(conversation);

    return this.toResponseSingle(conversation, viewerProfileId);
  }

  /**
   * Marca todas as mensagens recebidas (sender != viewer) da conversa
   * como lidas. Retorna a quantidade afetada.
   */
  async markAllAsRead(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<MarkAllAsReadResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    const viewerProfileId = await this.assertIsParticipant(
      conversation.adopterId,
      conversation.protetorId,
      usuarioId,
      tipoUsuario,
    );

    const markedAsRead =
      await this.messageRepository.markAllAsReadInConversation({
        conversationId: id,
        viewerProfileId,
      });

    return { markedAsRead };
  }

  /**
   * Compara o (adopterId, protetorId) da conversa/adoption_request com
   * o ID do perfil resolvido a partir do JWT. 403 se o usuário não for
   * participante. Retorna o `viewerProfileId` (adotantes.id ou
   * protetores_ongs.id) pra reuso em toResponse / mark-as-read.
   */
  private async assertIsParticipant(
    adopterId: string,
    protetorId: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<string> {
    if (tipoUsuario === TipoUsuario.Adotante) {
      const myAdopterId = await resolveAdotanteIdOrFail(
        this.adotanteRepository,
        usuarioId,
        tipoUsuario,
      );
      if (myAdopterId !== adopterId) {
        throw new ForbiddenException('Usuário não participa desta conversa');
      }
      return myAdopterId;
    }

    const myProtetorId = await resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
    if (myProtetorId !== protetorId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }
    return myProtetorId;
  }

  /**
   * Resolve o ID do perfil (adotantes.id ou protetores_ongs.id) a partir
   * do JWT. Não checa participação em conversa nenhuma — usar
   * `assertIsParticipant` quando há um recurso a validar.
   */
  private async resolveViewerProfileId(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<string> {
    if (tipoUsuario === TipoUsuario.Adotante) {
      return resolveAdotanteIdOrFail(
        this.adotanteRepository,
        usuarioId,
        tipoUsuario,
      );
    }
    return resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
  }

  private async toResponseBatch(
    conversations: Conversation[],
    viewerProfileId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversationIds = conversations
      .map((c) => c.id)
      .filter((id): id is string => !!id);

    const [adopters, protetores, unreadCounts, lastMessages] =
      await Promise.all([
        buildAdotanteSummaryMap(
          this.adotanteRepository,
          conversations.map((c) => c.adopterId),
        ),
        buildProtetorSummaryMap(
          this.protetorRepository,
          conversations.map((c) => c.protetorId),
        ),
        this.messageRepository.countUnreadByConversationForViewer({
          conversationIds,
          viewerProfileId,
        }),
        this.messageRepository.findLastMessageByConversation(conversationIds),
      ]);

    const responses = conversations.map((c) =>
      this.mapToResponse(
        c,
        adopters.get(c.adopterId) ?? null,
        protetores.get(c.protetorId) ?? null,
        c.id ? (unreadCounts.get(c.id) ?? 0) : 0,
        c.id ? (lastMessages.get(c.id) ?? null) : null,
      ),
    );

    // Ordena por última atividade desc (lastMessage.createdAt cai em
    // updatedAt da conversa quando não há mensagens).
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
    const [adopter, protetor, unreadCounts, lastMessages] = await Promise.all([
      fetchAdotanteSummary(this.adotanteRepository, conversation.adopterId),
      fetchProtetorSummary(this.protetorRepository, conversation.protetorId),
      this.messageRepository.countUnreadByConversationForViewer({
        conversationIds,
        viewerProfileId,
      }),
      this.messageRepository.findLastMessageByConversation(conversationIds),
    ]);

    const unread = conversation.id
      ? (unreadCounts.get(conversation.id) ?? 0)
      : 0;
    const lastMessage = conversation.id
      ? (lastMessages.get(conversation.id) ?? null)
      : null;

    return this.mapToResponse(
      conversation,
      adopter,
      protetor,
      unread,
      lastMessage,
    );
  }

  private mapToResponse(
    conversation: Conversation,
    adopter: ProfileSummary | null,
    protetor: ProfileSummary | null,
    unreadCount: number,
    lastMessage: LastMessageProjection | null,
  ): ConversationResponseDto {
    return {
      id: conversation.id ?? '',
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      adopter,
      protetor,
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
      senderTipo:
        lastMessage.senderId === conversation.adopterId
          ? 'adotante'
          : 'protetor',
    };
  }
}

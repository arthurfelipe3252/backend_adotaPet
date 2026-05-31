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
  ProfileSummary,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';
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
 *
 * Responses são enriquecidos com adopter/protetor summary (id + nome)
 * via batch lookup nas listas.
 */
@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly repository: ConversationRepository,
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

    await this.assertIsParticipant(
      adoptionRequest.adopterId,
      adoptionRequest.protetorId,
      usuarioId,
      tipoUsuario,
    );

    const existing = await this.repository.findByAdoptionRequestId(
      dto.adoptionRequestId,
    );
    if (existing) return this.toResponseSingle(existing);

    const conversation = Conversation.create({
      adoptionRequestId: dto.adoptionRequestId,
      adopterId: adoptionRequest.adopterId,
      protetorId: adoptionRequest.protetorId,
      isActive: true,
    });

    const created = await this.repository.create(conversation);
    return this.toResponseSingle(created);
  }

  async findAll(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<ConversationResponseDto[]> {
    let conversations: Conversation[];

    if (tipoUsuario === TipoUsuario.Adotante) {
      const adopterId = await resolveAdotanteIdOrFail(
        this.adotanteRepository,
        usuarioId,
        tipoUsuario,
      );
      conversations = await this.repository.findByParticipant({ adopterId });
    } else {
      const protetorId = await resolveProtetorIdOrFail(
        this.protetorRepository,
        usuarioId,
        tipoUsuario,
      );
      conversations = await this.repository.findByParticipant({ protetorId });
    }

    return this.toResponseBatch(conversations);
  }

  async findById(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    await this.assertIsParticipant(
      conversation.adopterId,
      conversation.protetorId,
      usuarioId,
      tipoUsuario,
    );
    return this.toResponseSingle(conversation);
  }

  async updateStatus(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: UpdateConversationActiveDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    await this.assertIsParticipant(
      conversation.adopterId,
      conversation.protetorId,
      usuarioId,
      tipoUsuario,
    );

    conversation.withActive(dto.isActive).touch(new Date());
    await this.repository.update(conversation);

    return this.toResponseSingle(conversation);
  }

  /**
   * Compara o (adopterId, protetorId) da conversa/adoption_request com
   * o ID do perfil resolvido a partir do JWT. 403 se o usuário não for
   * participante.
   */
  private async assertIsParticipant(
    adopterId: string,
    protetorId: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<void> {
    if (tipoUsuario === TipoUsuario.Adotante) {
      const myAdopterId = await resolveAdotanteIdOrFail(
        this.adotanteRepository,
        usuarioId,
        tipoUsuario,
      );
      if (myAdopterId !== adopterId) {
        throw new ForbiddenException('Usuário não participa desta conversa');
      }
      return;
    }

    const myProtetorId = await resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
    if (myProtetorId !== protetorId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }
  }

  private async toResponseBatch(
    conversations: Conversation[],
  ): Promise<ConversationResponseDto[]> {
    const [adopters, protetores] = await Promise.all([
      buildAdotanteSummaryMap(
        this.adotanteRepository,
        conversations.map((c) => c.adopterId),
      ),
      buildProtetorSummaryMap(
        this.protetorRepository,
        conversations.map((c) => c.protetorId),
      ),
    ]);
    return conversations.map((c) =>
      this.mapToResponse(
        c,
        adopters.get(c.adopterId) ?? null,
        protetores.get(c.protetorId) ?? null,
      ),
    );
  }

  private async toResponseSingle(
    conversation: Conversation,
  ): Promise<ConversationResponseDto> {
    const [adopter, protetor] = await Promise.all([
      fetchAdotanteSummary(this.adotanteRepository, conversation.adopterId),
      fetchProtetorSummary(this.protetorRepository, conversation.protetorId),
    ]);
    return this.mapToResponse(conversation, adopter, protetor);
  }

  private mapToResponse(
    conversation: Conversation,
    adopter: ProfileSummary | null,
    protetor: ProfileSummary | null,
  ): ConversationResponseDto {
    return {
      id: conversation.id ?? '',
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      adopter,
      protetor,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt ?? new Date(),
      updatedAt: conversation.updatedAt ?? new Date(),
    };
  }
}

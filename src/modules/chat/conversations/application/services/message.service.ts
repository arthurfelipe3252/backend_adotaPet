import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
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
} from '@identity/usuarios/application/helpers/profile-summary.helper';

/**
 * Regras de autorização do contexto @chat/messages:
 *
 *  - POST   /chat/conversations/:id/messages   senderId vem do JWT;
 *                                               precisa ser participante
 *  - GET    /chat/conversations/:id/messages   precisa ser participante
 *  - PATCH  /chat/messages/:id/read            precisa ser participante da
 *                                               conversa da mensagem
 *
 * O `senderId` que vai pro banco é o ID do perfil (adotantes.id ou
 * protetores_ongs.id), nunca o `usuarios.id` do JWT.
 *
 * Responses são enriquecidas com `sender` (id + nome + tipo). Como
 * mensagens de uma conversa pertencem aos 2 participantes (adopter e
 * protetor), na listagem o batch lookup busca um summary de cada um
 * e mapeia conforme o senderId.
 */
@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
    @Inject(ADOTANTE_REPOSITORY)
    private readonly adotanteRepository: AdotanteRepository,
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorRepository: ProtetorOngRepository,
  ) {}

  async create(
    conversationId: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    const senderId = await this.resolveParticipantIdOrFail(
      conversation,
      usuarioId,
      tipoUsuario,
    );

    const message = Message.create({
      conversationId,
      senderId,
      content: dto.content,
      isRead: false,
    });

    await this.messageRepository.create(message);
    conversation.touch(new Date());
    await this.conversationRepository.update(conversation);

    return this.toResponseSingle(message, conversation);
  }

  async findByConversation(
    conversationId: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    query: ListMessagesQueryDto,
  ): Promise<MessageResponseDto[]> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    await this.resolveParticipantIdOrFail(
      conversation,
      usuarioId,
      tipoUsuario,
    );

    const messages = await this.messageRepository.findByConversation({
      conversationId,
      limit: query.limit,
      offset: query.offset,
    });

    return this.toResponseBatch(messages, conversation);
  }

  async updateReadStatus(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: UpdateMessageReadDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(id);
    if (!message) throw new NotFoundException('Mensagem não encontrada');

    const conversation = await this.conversationRepository.findById(
      message.conversationId,
    );
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    await this.resolveParticipantIdOrFail(
      conversation,
      usuarioId,
      tipoUsuario,
    );

    message.withRead(dto.isRead).touch(new Date());
    await this.messageRepository.update(message);

    return this.toResponseSingle(message, conversation);
  }

  /**
   * Resolve o ID do perfil (adopter/protetor) a partir do JWT e verifica
   * que ele é participante da conversa. Retorna o ID resolvido pra ser
   * usado como `senderId`.
   */
  private async resolveParticipantIdOrFail(
    conversation: Conversation,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<string> {
    if (tipoUsuario === TipoUsuario.Adotante) {
      const adopterId = await resolveAdotanteIdOrFail(
        this.adotanteRepository,
        usuarioId,
        tipoUsuario,
      );
      if (adopterId !== conversation.adopterId) {
        throw new ForbiddenException('Usuário não participa desta conversa');
      }
      return adopterId;
    }

    const protetorId = await resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
    if (protetorId !== conversation.protetorId) {
      throw new ForbiddenException('Usuário não participa desta conversa');
    }
    return protetorId;
  }

  /**
   * Busca o summary do adopter e do protetor da conversa e mapeia
   * cada mensagem ao seu sender correspondente. Só 2 queries
   * independente da quantidade de mensagens.
   */
  private async resolveSendersOfConversation(
    conversation: Conversation,
  ): Promise<{
    adopter: SenderSummary | null;
    protetor: SenderSummary | null;
  }> {
    const [adopters, protetores] = await Promise.all([
      buildAdotanteSummaryMap(this.adotanteRepository, [
        conversation.adopterId,
      ]),
      buildProtetorSummaryMap(this.protetorRepository, [
        conversation.protetorId,
      ]),
    ]);
    const adopterSummary = adopters.get(conversation.adopterId);
    const protetorSummary = protetores.get(conversation.protetorId);
    return {
      adopter: adopterSummary
        ? { ...adopterSummary, tipo: 'adotante' }
        : null,
      protetor: protetorSummary
        ? { ...protetorSummary, tipo: 'protetor' }
        : null,
    };
  }

  private async toResponseSingle(
    message: Message,
    conversation: Conversation,
  ): Promise<MessageResponseDto> {
    const { adopter, protetor } =
      await this.resolveSendersOfConversation(conversation);
    return this.mapToResponse(message, conversation, adopter, protetor);
  }

  private async toResponseBatch(
    messages: Message[],
    conversation: Conversation,
  ): Promise<MessageResponseDto[]> {
    const { adopter, protetor } =
      await this.resolveSendersOfConversation(conversation);
    return messages.map((m) =>
      this.mapToResponse(m, conversation, adopter, protetor),
    );
  }

  private mapToResponse(
    message: Message,
    conversation: Conversation,
    adopter: SenderSummary | null,
    protetor: SenderSummary | null,
  ): MessageResponseDto {
    let sender: SenderSummary | null = null;
    if (message.senderId === conversation.adopterId) sender = adopter;
    else if (message.senderId === conversation.protetorId) sender = protetor;

    return {
      id: message.id ?? '',
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt ?? new Date(),
      updatedAt: message.updatedAt ?? new Date(),
    };
  }
}

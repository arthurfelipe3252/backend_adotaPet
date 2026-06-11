import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MessageService } from '@chat/conversations/application/services/message.service';
import { Message } from '@chat/conversations/domain/models/message.entity';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';
import type { AdotanteRepository } from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import type { ProtetorOngRepository } from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

const conversationId = '11111111-1111-1111-1111-111111111111';
const adopterId = '22222222-2222-2222-2222-222222222222';
const protetorId = '33333333-3333-3333-3333-333333333333';
const adopterUsuarioId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const outroAdopterUsuarioId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const buildConversation = () =>
  Conversation.restore({
    id: conversationId,
    adoptionRequestId: '44444444-4444-4444-4444-444444444444',
    adopterId,
    protetorId,
    isActive: true,
    createdAt: new Date('2026-05-18T00:00:00.000Z'),
    updatedAt: new Date('2026-05-18T00:00:00.000Z'),
  })!;

describe('MessageService', () => {
  const messageRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByConversation: jest.fn(),
  };

  const conversationRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByAdoptionRequestId: jest.fn(),
    findByParticipant: jest.fn(),
  };

  const adotanteRepository = {
    buscarPorUsuarioId: jest.fn(),
    findSummariesByIds: jest.fn(),
  };

  const protetorRepository = {
    buscarPorUsuarioId: jest.fn(),
    findSummariesByIds: jest.fn(),
  };

  const service = new MessageService(
    messageRepository,
    conversationRepository,
    adotanteRepository as unknown as AdotanteRepository,
    protetorRepository as unknown as ProtetorOngRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    adotanteRepository.buscarPorUsuarioId.mockImplementation((usuarioId) => {
      if (usuarioId === adopterUsuarioId) return { id: adopterId };
      if (usuarioId === outroAdopterUsuarioId)
        return { id: '99999999-9999-9999-9999-999999999999' };
      return null;
    });
    adotanteRepository.findSummariesByIds.mockImplementation((ids: string[]) =>
      ids.includes(adopterId) ? [{ id: adopterId, nome: 'João' }] : [],
    );
    protetorRepository.findSummariesByIds.mockImplementation((ids: string[]) =>
      ids.includes(protetorId) ? [{ id: protetorId, nome: 'ONG Bicho' }] : [],
    );
  });

  it('throws when conversation is missing', async () => {
    conversationRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(conversationId, adopterUsuarioId, TipoUsuario.Adotante, {
        content: 'Oi',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when sender is not a participant', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());

    await expect(
      service.create(
        conversationId,
        outroAdopterUsuarioId,
        TipoUsuario.Adotante,
        { content: 'Oi' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a message and updates the conversation', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());
    // create agora retorna a entidade reidratada com id do banco
    messageRepository.create.mockImplementation((msg: Message) =>
      Message.restore({
        id: '88888888-8888-8888-8888-888888888888',
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        isRead: msg.isRead,
        createdAt: msg.createdAt ?? new Date(),
        updatedAt: msg.updatedAt ?? new Date(),
      }),
    );

    const result = await service.create(
      conversationId,
      adopterUsuarioId,
      TipoUsuario.Adotante,
      { content: 'Mensagem teste' },
    );

    expect(messageRepository.create).toHaveBeenCalledTimes(1);
    expect(conversationRepository.update).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      conversationId,
      senderId: adopterId,
      content: 'Mensagem teste',
      isRead: false,
    });
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('lists messages by conversation', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());

    const message = Message.restore({
      id: '55555555-5555-5555-5555-555555555555',
      conversationId,
      senderId: adopterId,
      content: 'Oi',
      isRead: true,
      createdAt: new Date('2026-05-18T10:00:00.000Z'),
      updatedAt: new Date('2026-05-18T10:00:00.000Z'),
    })!;

    messageRepository.findByConversation.mockResolvedValue([message]);

    const result = await service.findByConversation(
      conversationId,
      adopterUsuarioId,
      TipoUsuario.Adotante,
      { limit: 10, offset: 0 },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: message.id,
      conversationId,
      senderId: adopterId,
      content: 'Oi',
      isRead: true,
    });
  });

  it('throws when listing messages for missing conversation', async () => {
    conversationRepository.findById.mockResolvedValue(null);

    await expect(
      service.findByConversation(
        conversationId,
        adopterUsuarioId,
        TipoUsuario.Adotante,
        {},
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates message read status (msg do outro participante)', async () => {
    // Adotante marcando como lida uma mensagem enviada pelo protetor.
    const message = Message.restore({
      id: '66666666-6666-6666-6666-666666666666',
      conversationId,
      senderId: protetorId,
      content: 'Ping do protetor',
      isRead: false,
      createdAt: new Date('2026-05-18T11:00:00.000Z'),
      updatedAt: new Date('2026-05-18T11:00:00.000Z'),
    })!;

    messageRepository.findById.mockResolvedValue(message);
    conversationRepository.findById.mockResolvedValue(buildConversation());

    const result = await service.updateReadStatus(
      message.id!,
      adopterUsuarioId,
      TipoUsuario.Adotante,
      { isRead: true },
    );

    expect(messageRepository.update).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: message.id,
      isRead: true,
    });
  });

  it('throws when updating missing message', async () => {
    messageRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateReadStatus(
        '77777777-7777-7777-7777-777777777777',
        adopterUsuarioId,
        TipoUsuario.Adotante,
        { isRead: true },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to mark own message as read (400)', async () => {
    // Adotante tentando marcar uma mensagem que ele próprio enviou.
    const ownMessage = Message.restore({
      id: '88888888-8888-8888-8888-888888888888',
      conversationId,
      senderId: adopterId,
      content: 'mensagem própria',
      isRead: false,
      createdAt: new Date('2026-05-18T11:00:00.000Z'),
      updatedAt: new Date('2026-05-18T11:00:00.000Z'),
    })!;
    messageRepository.findById.mockResolvedValue(ownMessage);
    conversationRepository.findById.mockResolvedValue(buildConversation());

    await expect(
      service.updateReadStatus(
        ownMessage.id!,
        adopterUsuarioId,
        TipoUsuario.Adotante,
        { isRead: true },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(messageRepository.update).not.toHaveBeenCalled();
  });
});

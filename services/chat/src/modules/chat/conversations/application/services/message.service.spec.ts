import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessageService } from '@chat/conversations/application/services/message.service';
import { Message } from '@chat/conversations/domain/models/message.entity';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';

const conversationId = '11111111-1111-1111-1111-111111111111';
const adopterUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const protetorUserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const outroUserId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const adopterJwt = { sub: adopterUserId, tipoUsuario: 'adotante', permissions: [] };
const protetorJwt = { sub: protetorUserId, tipoUsuario: 'protetor', permissions: [] };
const outroJwt = { sub: outroUserId, tipoUsuario: 'adotante', permissions: [] };

const buildConversation = () =>
  Conversation.restore({
    id: conversationId,
    adoptionRequestId: '44444444-4444-4444-4444-444444444444',
    adopterId: adopterUserId,
    protetorId: protetorUserId,
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

  const chatMessaging = {
    publishMessageCreated: jest.fn().mockResolvedValue(undefined),
    publishConversationCreated: jest.fn().mockResolvedValue(undefined),
  };

  const service = new MessageService(messageRepository, conversationRepository, chatMessaging as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when conversation is missing', async () => {
    conversationRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(conversationId, adopterJwt, { content: 'Oi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when sender is not a participant', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());

    await expect(
      service.create(conversationId, outroJwt, { content: 'Oi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a message and updates the conversation', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());
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

    const result = await service.create(conversationId, adopterJwt, {
      content: 'Mensagem teste',
    });

    expect(messageRepository.create).toHaveBeenCalledTimes(1);
    expect(conversationRepository.update).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      conversationId,
      senderId: adopterUserId,
      content: 'Mensagem teste',
      isRead: false,
    });
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('protetor can also create a message', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());
    messageRepository.create.mockImplementation((msg: Message) =>
      Message.restore({
        id: '99999999-9999-9999-9999-999999999999',
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        isRead: msg.isRead,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const result = await service.create(conversationId, protetorJwt, {
      content: 'Resposta',
    });

    expect(result.senderId).toBe(protetorUserId);
  });

  it('lists messages by conversation', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());

    const message = Message.restore({
      id: '55555555-5555-5555-5555-555555555555',
      conversationId,
      senderId: adopterUserId,
      content: 'Oi',
      isRead: true,
      createdAt: new Date('2026-05-18T10:00:00.000Z'),
      updatedAt: new Date('2026-05-18T10:00:00.000Z'),
    })!;

    messageRepository.findByConversation.mockResolvedValue([message]);

    const result = await service.findByConversation(
      conversationId,
      adopterJwt,
      { limit: 10, offset: 0 },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: message.id,
      conversationId,
      senderId: adopterUserId,
      content: 'Oi',
      isRead: true,
    });
  });

  it('throws when listing messages for missing conversation', async () => {
    conversationRepository.findById.mockResolvedValue(null);

    await expect(
      service.findByConversation(conversationId, adopterJwt, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates message read status', async () => {
    const message = Message.restore({
      id: '66666666-6666-6666-6666-666666666666',
      conversationId,
      senderId: adopterUserId,
      content: 'Ping',
      isRead: false,
      createdAt: new Date('2026-05-18T11:00:00.000Z'),
      updatedAt: new Date('2026-05-18T11:00:00.000Z'),
    })!;

    messageRepository.findById.mockResolvedValue(message);
    conversationRepository.findById.mockResolvedValue(buildConversation());

    const result = await service.updateReadStatus(message.id!, adopterJwt, {
      isRead: true,
    });

    expect(messageRepository.update).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: message.id, isRead: true });
  });

  it('throws when updating missing message', async () => {
    messageRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateReadStatus(
        '77777777-7777-7777-7777-777777777777',
        adopterJwt,
        { isRead: true },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

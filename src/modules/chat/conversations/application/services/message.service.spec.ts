import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MessageService } from '@chat/conversations/application/services/message.service';
import { Message } from '@chat/conversations/domain/models/message.entity';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';

const conversationId = '11111111-1111-1111-1111-111111111111';
const adopterId = '22222222-2222-2222-2222-222222222222';
const protetorId = '33333333-3333-3333-3333-333333333333';

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

  const service = new MessageService(messageRepository, conversationRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when conversation is missing', async () => {
    conversationRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(conversationId, {
        senderId: adopterId,
        content: 'Oi',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when sender is not a participant', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());

    await expect(
      service.create(conversationId, {
        senderId: '99999999-9999-9999-9999-999999999999',
        content: 'Oi',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a message and updates the conversation', async () => {
    conversationRepository.findById.mockResolvedValue(buildConversation());

    const result = await service.create(conversationId, {
      senderId: adopterId,
      content: 'Mensagem teste',
    });

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

    const result = await service.findByConversation(conversationId, {
      limit: 10,
      offset: 0,
    });

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
      service.findByConversation(conversationId, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates message read status', async () => {
    const message = Message.restore({
      id: '66666666-6666-6666-6666-666666666666',
      conversationId,
      senderId: adopterId,
      content: 'Ping',
      isRead: false,
      createdAt: new Date('2026-05-18T11:00:00.000Z'),
      updatedAt: new Date('2026-05-18T11:00:00.000Z'),
    })!;

    messageRepository.findById.mockResolvedValue(message);

    const result = await service.updateReadStatus(message.id!, {
      isRead: true,
    });

    expect(messageRepository.update).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: message.id,
      isRead: true,
    });
  });

  it('throws when updating missing message', async () => {
    messageRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateReadStatus('77777777-7777-7777-7777-777777777777', {
        isRead: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

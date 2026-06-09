import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MessageService } from './message.service';
import { CONVERSATION_REPOSITORY } from '../../domain/repositories/conversation-repository.interface';
import { MESSAGE_REPOSITORY } from '../../domain/repositories/message-repository.interface';
import { Conversation } from '../../domain/models/conversation.entity';
import { Message } from '../../domain/models/message.entity';

const makeConv = () =>
  Conversation.restore({
    id: 'conv-1',
    adoptionRequestId: 'req-1',
    adopterId: 'adopter-1',
    protetorId: 'protetor-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const makeMsg = () =>
  Message.restore({
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'adopter-1',
    content: 'Olá!',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const mockMsgRepo = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findByConversation: jest.fn(),
};

const mockConvRepo = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllPaginated: jest.fn(),
  findByAdoptionRequestId: jest.fn(),
  findByParticipant: jest.fn(),
};

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessageService(mockMsgRepo as any, mockConvRepo as any);
  });

  describe('create', () => {
    it('deve criar mensagem se remetente é participante da conversa', async () => {
      mockConvRepo.findById.mockResolvedValue(makeConv());
      mockMsgRepo.create.mockResolvedValue(undefined);
      mockConvRepo.update.mockResolvedValue(undefined);

      const result = await service.create('conv-1', { senderId: 'adopter-1', content: 'Olá!' });

      expect(result.content).toBe('Olá!');
      expect(result.isRead).toBe(false);
    });

    it('deve lançar NotFoundException se conversa não existe', async () => {
      mockConvRepo.findById.mockResolvedValue(null);

      await expect(service.create('inexistente', { senderId: 's', content: 'x' }))
        .rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se remetente não é participante', async () => {
      mockConvRepo.findById.mockResolvedValue(makeConv());

      await expect(service.create('conv-1', { senderId: 'estranho-id', content: 'hack' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateReadStatus', () => {
    it('deve marcar mensagem como lida', async () => {
      mockMsgRepo.findById.mockResolvedValue(makeMsg());
      mockMsgRepo.update.mockResolvedValue(undefined);

      const result = await service.updateReadStatus('msg-1', { isRead: true });
      expect(result.isRead).toBe(true);
    });

    it('deve lançar NotFoundException se mensagem não existe', async () => {
      mockMsgRepo.findById.mockResolvedValue(null);
      await expect(service.updateReadStatus('inexistente', { isRead: true }))
        .rejects.toThrow(NotFoundException);
    });
  });
});

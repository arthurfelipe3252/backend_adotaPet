import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CONVERSATION_REPOSITORY } from '../../domain/repositories/conversation-repository.interface';
import { Conversation } from '../../domain/models/conversation.entity';

const makeConv = (overrides = {}) =>
  Conversation.restore({
    id: 'uuid-1',
    adoptionRequestId: 'req-1',
    adopterId: 'adopter-1',
    protetorId: 'protetor-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })!;

const mockRepo = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllPaginated: jest.fn(),
  findByAdoptionRequestId: jest.fn(),
  findByParticipant: jest.fn(),
};

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversationService(mockRepo as any);
  });

  describe('create', () => {
    it('deve criar nova conversa quando não existe', async () => {
      mockRepo.findByAdoptionRequestId.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(undefined);

      const result = await service.create({
        adoptionRequestId: 'req-1',
        adopterId: 'adopter-1',
        protetorId: 'protetor-1',
      });

      expect(result.adoptionRequestId).toBe('req-1');
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it('deve retornar conversa existente se já criada para a solicitação', async () => {
      const existing = makeConv();
      mockRepo.findByAdoptionRequestId.mockResolvedValue(existing);

      const result = await service.create({
        adoptionRequestId: 'req-1',
        adopterId: 'adopter-1',
        protetorId: 'protetor-1',
      });

      expect(result.id).toBe('uuid-1');
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('deve retornar conversa quando existe', async () => {
      mockRepo.findById.mockResolvedValue(makeConv());
      const result = await service.findById('uuid-1');
      expect(result.id).toBe('uuid-1');
    });

    it('deve lançar NotFoundException quando não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar isActive da conversa', async () => {
      mockRepo.findById.mockResolvedValue(makeConv());
      mockRepo.update.mockResolvedValue(undefined);

      const result = await service.updateStatus('uuid-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe('findAll', () => {
    it('deve lançar BadRequestException se nenhum filtro informado', async () => {
      await expect(service.findAll({})).rejects.toThrow(BadRequestException);
    });

    it('deve buscar por adopterId', async () => {
      mockRepo.findByParticipant.mockResolvedValue([makeConv()]);
      const result = await service.findAll({ adopterId: 'adopter-1' });
      expect(result).toHaveLength(1);
    });
  });
});

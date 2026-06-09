import { NotFoundException } from '@nestjs/common';
import { AdoptionRequestService } from './adoption-request.service';
import { ADOPTION_REQUEST_REPOSITORY } from '../../domain/repositories/adoption-request-repository.interface';
import { AdoptionRequest } from '../../domain/models/adoption-request.entity';

const makeRequest = (overrides = {}) =>
  AdoptionRequest.restore({
    id: 'uuid-1',
    petId: 'pet-1',
    adopterId: 'adopter-1',
    status: 'received',
    preTriageStatus: 'review',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })!;

const mockRepo = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findAllPaginated: jest.fn(),
  findById: jest.fn(),
  findByAdopterId: jest.fn(),
  findByProtetorId: jest.fn(),
};

const mockMessaging = {
  publishRequestCreated: jest.fn().mockResolvedValue(undefined),
  publishRequestUpdated: jest.fn().mockResolvedValue(undefined),
  onApplicationBootstrap: jest.fn(),
};

describe('AdoptionRequestService', () => {
  let service: AdoptionRequestService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdoptionRequestService(mockRepo as any, mockMessaging as any);
  });

  describe('create', () => {
    it('deve criar solicitação e publicar evento', async () => {
      mockRepo.create.mockResolvedValue(undefined);

      const result = await service.create({ petId: 'pet-1', adopterId: 'adopter-1' });

      expect(result.petId).toBe('pet-1');
      expect(result.status).toBe('received');
      expect(mockMessaging.publishRequestCreated).toHaveBeenCalledTimes(1);
    });

    it('deve classificar preTriageStatus como qualified quando matchScore >= 70', async () => {
      mockRepo.create.mockResolvedValue(undefined);
      const result = await service.create({ petId: 'p', adopterId: 'a', matchScore: 75 });
      expect(result.preTriageStatus).toBe('qualified');
    });

    it('deve classificar preTriageStatus como disqualified quando matchScore < 70', async () => {
      mockRepo.create.mockResolvedValue(undefined);
      const result = await service.create({ petId: 'p', adopterId: 'a', matchScore: 50 });
      expect(result.preTriageStatus).toBe('disqualified');
    });
  });

  describe('findById', () => {
    it('deve retornar DTO quando solicitação existe', async () => {
      mockRepo.findById.mockResolvedValue(makeRequest());
      const result = await service.findById('uuid-1');
      expect(result.id).toBe('uuid-1');
    });

    it('deve lançar NotFoundException quando não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status e publicar evento', async () => {
      mockRepo.findById.mockResolvedValue(makeRequest());
      mockRepo.update.mockResolvedValue(undefined);

      const result = await service.updateStatus('uuid-1', { status: 'approved' });

      expect(result.status).toBe('approved');
      expect(mockMessaging.publishRequestUpdated).toHaveBeenCalledTimes(1);
    });
  });

  describe('listPaginated', () => {
    it('deve retornar resultado paginado', async () => {
      mockRepo.findAllPaginated.mockResolvedValue({ rows: [makeRequest()], total: 1 });
      const result = await service.listPaginated({ page: 1, limit: 10 });
      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdoptionRequestService } from './adoption-request.service';
import { AdoptionRequest } from '@adoption/adoption-requests/domain/models/adoption-request.entity';

const adopterId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const protetorId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const otherId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const petId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const requestId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const adotanteJwt = { sub: adopterId, tipoUsuario: 'adotante', permissions: [] };
const protetorJwt = { sub: protetorId, tipoUsuario: 'protetor', permissions: [] };
const outroAdotanteJwt = { sub: otherId, tipoUsuario: 'adotante', permissions: [] };

const buildRequest = (overrides: Partial<{
  adopterId: string;
  protetorId: string | null;
  status: string;
}> = {}) =>
  AdoptionRequest.restore({
    id: requestId,
    petId,
    adopterId: overrides.adopterId ?? adopterId,
    protetorId: overrides.protetorId ?? protetorId,
    status: overrides.status ?? 'received',
    preTriageStatus: 'review',
    matchScore: null,
    matchAnswers: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

describe('AdoptionRequestService', () => {
  const repository = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  const messagingService = {
    publishRequestCreated: jest.fn().mockResolvedValue(undefined),
    publishRequestUpdated: jest.fn().mockResolvedValue(undefined),
  };

  const service = new AdoptionRequestService(repository as any, messagingService as any);

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates request and publishes event', async () => {
      const created = buildRequest();
      repository.create.mockResolvedValue(created);

      const result = await service.create(adotanteJwt, {
        petId,
        protetorId,
        mensagem: 'Gostaria de adotar',
      } as any);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(messagingService.publishRequestCreated).toHaveBeenCalledWith({
        id: requestId,
        adopterId,
      });
      expect(result.id).toBe(requestId);
    });
  });

  describe('findAll', () => {
    it('filters by adopterId when user is adotante', async () => {
      repository.findAll.mockResolvedValue([buildRequest()]);

      const result = await service.findAll(adotanteJwt);

      expect(repository.findAll).toHaveBeenCalledWith({ adopterId });
      expect(result).toHaveLength(1);
    });

    it('filters by protetorId when user is protetor', async () => {
      repository.findAll.mockResolvedValue([buildRequest()]);

      const result = await service.findAll(protetorJwt);

      expect(repository.findAll).toHaveBeenCalledWith({ protetorId });
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(requestId, adotanteJwt)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when adotante requests another user request', async () => {
      repository.findById.mockResolvedValue(buildRequest({ adopterId: otherId }));

      await expect(service.findById(requestId, adotanteJwt)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when protetor requests another protetor request', async () => {
      repository.findById.mockResolvedValue(buildRequest({ protetorId: otherId }));

      await expect(service.findById(requestId, protetorJwt)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns request for own adotante', async () => {
      repository.findById.mockResolvedValue(buildRequest());

      const result = await service.findById(requestId, adotanteJwt);

      expect(result.id).toBe(requestId);
    });

    it('returns request for own protetor', async () => {
      repository.findById.mockResolvedValue(buildRequest());

      const result = await service.findById(requestId, protetorJwt);

      expect(result.id).toBe(requestId);
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus(requestId, protetorJwt, { status: 'approved' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when another protetor tries to update', async () => {
      repository.findById.mockResolvedValue(buildRequest({ protetorId: otherId }));

      await expect(
        service.updateStatus(requestId, protetorJwt, { status: 'approved' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates status and publishes event', async () => {
      const request = buildRequest();
      repository.findById.mockResolvedValue(request);
      repository.update.mockResolvedValue(undefined);

      const result = await service.updateStatus(requestId, protetorJwt, {
        status: 'approved',
      } as any);

      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(messagingService.publishRequestUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ id: requestId, status: 'approved' }),
      );
      expect(result.status).toBe('approved');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete(requestId, adotanteJwt)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when another adotante tries to delete', async () => {
      repository.findById.mockResolvedValue(buildRequest());

      await expect(service.delete(requestId, outroAdotanteJwt)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('deletes request when own adotante', async () => {
      repository.findById.mockResolvedValue(buildRequest());
      repository.delete.mockResolvedValue(undefined);

      await service.delete(requestId, adotanteJwt);

      expect(repository.delete).toHaveBeenCalledWith(requestId);
    });
  });
});

import { AdoptionRequestsController } from './adoption-requests.controller';

const adopterId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const protetorId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const requestId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const adotanteJwt = { sub: adopterId, tipoUsuario: 'adotante', permissions: [] };
const protetorJwt = { sub: protetorId, tipoUsuario: 'protetor', permissions: [] };
const mockResponse = { id: requestId, adopterId, petId: 'pet-id' };

describe('AdoptionRequestsController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };

  const controller = new AdoptionRequestsController(service as any);

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delegates to service.create with user and dto', async () => {
      const dto = { petId: 'pet-id', protetorId };
      service.create.mockResolvedValue(mockResponse);

      const result = await controller.create(adotanteJwt as any, dto as any);

      expect(service.create).toHaveBeenCalledWith(adotanteJwt, dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    it('delegates to service.findAll with user', async () => {
      service.findAll.mockResolvedValue([mockResponse]);

      const result = await controller.findAll(adotanteJwt as any);

      expect(service.findAll).toHaveBeenCalledWith(adotanteJwt);
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('delegates to service.findById with id and user', async () => {
      service.findById.mockResolvedValue(mockResponse);

      const result = await controller.findById(requestId, adotanteJwt as any);

      expect(service.findById).toHaveBeenCalledWith(requestId, adotanteJwt);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateStatus', () => {
    it('delegates to service.updateStatus with id, user, dto', async () => {
      const dto = { status: 'approved' };
      service.updateStatus.mockResolvedValue({ ...mockResponse, status: 'approved' });

      const result = await controller.updateStatus(requestId, protetorJwt as any, dto as any);

      expect(service.updateStatus).toHaveBeenCalledWith(requestId, protetorJwt, dto);
      expect(result).toMatchObject({ status: 'approved' });
    });
  });

  describe('delete', () => {
    it('delegates to service.delete with id and user', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete(requestId, adotanteJwt as any);

      expect(service.delete).toHaveBeenCalledWith(requestId, adotanteJwt);
    });
  });
});

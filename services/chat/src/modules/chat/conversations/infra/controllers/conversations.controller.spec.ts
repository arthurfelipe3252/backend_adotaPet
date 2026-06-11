import { ConversationsController } from './conversations.controller';

const adopterId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const conversationId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const adotanteJwt = { sub: adopterId, tipoUsuario: 'adotante', permissions: [] };
const mockConversation = { id: conversationId, adopterId };

describe('ConversationsController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  const controller = new ConversationsController(service as any);

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delegates to service.create', async () => {
      const dto = { adoptionRequestId: 'req-id', protetorId: 'protetor-id' };
      service.create.mockResolvedValue(mockConversation);

      const result = await controller.create(adotanteJwt as any, dto as any);

      expect(service.create).toHaveBeenCalledWith(adotanteJwt, dto);
      expect(result).toEqual(mockConversation);
    });
  });

  describe('findAll', () => {
    it('delegates to service.findAll', async () => {
      service.findAll.mockResolvedValue([mockConversation]);

      const result = await controller.findAll(adotanteJwt as any);

      expect(service.findAll).toHaveBeenCalledWith(adotanteJwt);
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('delegates to service.findById', async () => {
      service.findById.mockResolvedValue(mockConversation);

      const result = await controller.findById(conversationId, adotanteJwt as any);

      expect(service.findById).toHaveBeenCalledWith(conversationId, adotanteJwt);
      expect(result).toEqual(mockConversation);
    });
  });

  describe('updateStatus', () => {
    it('delegates to service.updateStatus', async () => {
      const dto = { isActive: false };
      service.updateStatus.mockResolvedValue({ ...mockConversation, isActive: false });

      const result = await controller.updateStatus(conversationId, adotanteJwt as any, dto);

      expect(service.updateStatus).toHaveBeenCalledWith(conversationId, adotanteJwt, dto);
      expect(result).toMatchObject({ isActive: false });
    });
  });
});

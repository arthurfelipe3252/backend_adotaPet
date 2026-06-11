import { MessagesController } from './messages.controller';

const adopterId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const conversationId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const messageId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const adotanteJwt = { sub: adopterId, tipoUsuario: 'adotante', permissions: [] };
const mockMessage = { id: messageId, conversationId, senderId: adopterId, content: 'Oi' };

describe('MessagesController', () => {
  const service = {
    create: jest.fn(),
    findByConversation: jest.fn(),
    updateReadStatus: jest.fn(),
  };

  const controller = new MessagesController(service as any);

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delegates to service.create with conversationId, user, dto', async () => {
      const dto = { content: 'Olá' };
      service.create.mockResolvedValue(mockMessage);

      const result = await controller.create(conversationId, adotanteJwt as any, dto as any);

      expect(service.create).toHaveBeenCalledWith(conversationId, adotanteJwt, dto);
      expect(result).toEqual(mockMessage);
    });
  });

  describe('findByConversation', () => {
    it('delegates to service.findByConversation', async () => {
      const query = { limit: 20, offset: 0 };
      service.findByConversation.mockResolvedValue([mockMessage]);

      const result = await controller.findByConversation(
        conversationId,
        adotanteJwt as any,
        query as any,
      );

      expect(service.findByConversation).toHaveBeenCalledWith(
        conversationId,
        adotanteJwt,
        query,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('updateReadStatus', () => {
    it('delegates to service.updateReadStatus', async () => {
      const dto = { isRead: true };
      service.updateReadStatus.mockResolvedValue({ ...mockMessage, isRead: true });

      const result = await controller.updateReadStatus(messageId, adotanteJwt as any, dto as any);

      expect(service.updateReadStatus).toHaveBeenCalledWith(messageId, adotanteJwt, dto);
      expect(result).toMatchObject({ isRead: true });
    });
  });
});

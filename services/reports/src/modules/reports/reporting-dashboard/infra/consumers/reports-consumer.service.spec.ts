import { ReportsConsumerService } from './reports-consumer.service';

const petId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const requestId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const conversationId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const messageId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

describe('ReportsConsumerService', () => {
  const insertChain = { values: jest.fn().mockReturnThis(), onConflictDoNothing: jest.fn().mockResolvedValue(undefined) };
  const updateChain = { set: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue(undefined) };
  const deleteChain = { where: jest.fn().mockResolvedValue(undefined) };

  const drizzle = {
    db: {
      insert: jest.fn().mockReturnValue(insertChain),
      update: jest.fn().mockReturnValue(updateChain),
      delete: jest.fn().mockReturnValue(deleteChain),
    },
  };

  const consumedHandlers: Map<string, (payload: unknown) => Promise<void>> = new Map();

  const rabbitMQ = {
    consume: jest.fn().mockImplementation(
      async (_exchange: string, routingKey: string, queue: string, handler: (p: unknown) => Promise<void>) => {
        consumedHandlers.set(queue, handler);
      },
    ),
  };

  const service = new ReportsConsumerService(rabbitMQ as any, drizzle as any);

  beforeEach(() => {
    jest.clearAllMocks();
    consumedHandlers.clear();
    insertChain.values.mockReturnThis();
    insertChain.onConflictDoNothing.mockResolvedValue(undefined);
    updateChain.set.mockReturnThis();
    updateChain.where.mockResolvedValue(undefined);
    deleteChain.where.mockResolvedValue(undefined);
    drizzle.db.insert.mockReturnValue(insertChain);
    drizzle.db.update.mockReturnValue(updateChain);
    drizzle.db.delete.mockReturnValue(deleteChain);
    rabbitMQ.consume.mockImplementation(
      async (_exchange: string, _routingKey: string, queue: string, handler: (p: unknown) => Promise<void>) => {
        consumedHandlers.set(queue, handler);
      },
    );
  });

  describe('onApplicationBootstrap', () => {
    it('registers 7 consumers', async () => {
      await service.onApplicationBootstrap();

      expect(rabbitMQ.consume).toHaveBeenCalledTimes(7);
    });

    it('registers all required queue names', async () => {
      await service.onApplicationBootstrap();

      const queues = [...consumedHandlers.keys()];
      expect(queues).toContain('reports.service.pet-created');
      expect(queues).toContain('reports.service.pet-updated');
      expect(queues).toContain('reports.service.pet-deleted');
      expect(queues).toContain('reports.service.adoption-created');
      expect(queues).toContain('reports.service.adoption-updated');
      expect(queues).toContain('reports.service.conversation-created');
      expect(queues).toContain('reports.service.message-created');
    });
  });

  describe('pet-created handler', () => {
    it('inserts into report_pets on pet.created event', async () => {
      await service.onApplicationBootstrap();
      const handler = consumedHandlers.get('reports.service.pet-created')!;

      await handler({
        id: petId,
        protetorId: 'protetor-id',
        nome: 'Rex',
        especie: 'cao',
        porte: 'medio',
        status: 'disponivel',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(drizzle.db.insert).toHaveBeenCalledTimes(1);
      expect(insertChain.values).toHaveBeenCalledWith(expect.objectContaining({ id: petId }));
    });
  });

  describe('pet-updated handler', () => {
    it('updates report_pets on pet.updated event', async () => {
      await service.onApplicationBootstrap();
      const handler = consumedHandlers.get('reports.service.pet-updated')!;

      await handler({
        id: petId,
        status: 'adotado',
        updatedAt: new Date().toISOString(),
      });

      expect(drizzle.db.update).toHaveBeenCalledTimes(1);
      expect(updateChain.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'adotado' }));
    });
  });

  describe('pet-deleted handler', () => {
    it('deletes from report_pets on pet.deleted event', async () => {
      await service.onApplicationBootstrap();
      const handler = consumedHandlers.get('reports.service.pet-deleted')!;

      await handler({ id: petId });

      expect(drizzle.db.delete).toHaveBeenCalledTimes(1);
      expect(deleteChain.where).toHaveBeenCalledTimes(1);
    });
  });

  describe('adoption-created handler', () => {
    it('inserts into report_adoption_requests', async () => {
      await service.onApplicationBootstrap();
      const handler = consumedHandlers.get('reports.service.adoption-created')!;

      await handler({
        id: requestId,
        petId: petId,
        adopterId: 'adopter-id',
        status: 'received',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(drizzle.db.insert).toHaveBeenCalledTimes(1);
      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ id: requestId, status: 'received' }),
      );
    });
  });

  describe('adoption-updated handler', () => {
    it('updates report_adoption_requests', async () => {
      await service.onApplicationBootstrap();
      const handler = consumedHandlers.get('reports.service.adoption-updated')!;

      await handler({
        id: requestId,
        status: 'approved',
      });

      expect(drizzle.db.update).toHaveBeenCalledTimes(1);
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' }),
      );
    });
  });

  describe('conversation-created handler', () => {
    it('inserts into report_conversations', async () => {
      await service.onApplicationBootstrap();
      const handler = consumedHandlers.get('reports.service.conversation-created')!;

      await handler({
        id: conversationId,
        adopterId: 'adopter-id',
        protetorId: 'protetor-id',
      });

      expect(drizzle.db.insert).toHaveBeenCalledTimes(1);
      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ id: conversationId }),
      );
    });
  });

  describe('message-created handler', () => {
    it('inserts into report_messages', async () => {
      await service.onApplicationBootstrap();
      const handler = consumedHandlers.get('reports.service.message-created')!;

      await handler({
        id: messageId,
        conversationId,
        senderId: 'sender-id',
        isRead: false,
      });

      expect(drizzle.db.insert).toHaveBeenCalledTimes(1);
      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ id: messageId, isRead: false }),
      );
    });
  });
});

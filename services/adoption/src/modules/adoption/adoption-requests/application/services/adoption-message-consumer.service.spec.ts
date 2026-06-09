import { AdoptionMessageConsumerService } from './adoption-message-consumer.service';

const mockChannel = {
  assertExchange: jest.fn().mockResolvedValue(undefined),
  assertQueue: jest.fn().mockResolvedValue(undefined),
  bindQueue: jest.fn().mockResolvedValue(undefined),
  consume: jest.fn().mockResolvedValue(undefined),
  ack: jest.fn(),
  nack: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockRabbitMQService = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
};

const mockPetLocalRepo = {
  upsert: jest.fn().mockResolvedValue(undefined),
  deleteByExternalId: jest.fn().mockResolvedValue(undefined),
};

describe('AdoptionMessageConsumerService', () => {
  let service: AdoptionMessageConsumerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdoptionMessageConsumerService(
      mockRabbitMQService as any,
      mockPetLocalRepo as any,
    );
  });

  describe('onApplicationBootstrap', () => {
    it('deve criar canal dedicado e registrar 3 consumers', async () => {
      await service.onApplicationBootstrap();

      expect(mockRabbitMQService.createChannel).toHaveBeenCalledTimes(1);
      expect(mockChannel.assertQueue).toHaveBeenCalledTimes(3);
      expect(mockChannel.bindQueue).toHaveBeenCalledTimes(3);
      expect(mockChannel.consume).toHaveBeenCalledTimes(3);
    });
  });

  describe('onModuleDestroy', () => {
    it('deve fechar o canal ao destruir o módulo', async () => {
      await service.onApplicationBootstrap();
      await service.onModuleDestroy();
      expect(mockChannel.close).toHaveBeenCalledTimes(1);
    });
  });
});

import { CatalogPetConsumer } from './catalog-pet-consumer.service';
import {
  CatalogExchangeName,
  CatalogRoutingKey,
} from '@shared/contracts/events/catalog-events.enum';

describe('CatalogPetConsumer', () => {
  const matchPetRepo = {
    upsert: jest.fn().mockResolvedValue(undefined),
    deleteById: jest.fn().mockResolvedValue(undefined),
    findAvailable: jest.fn(),
  };

  // Captura os handlers registrados por nome de fila pra invocá-los nos testes.
  const handlers: Record<string, (payload: unknown) => Promise<void>> = {};
  const rabbitMQ = {
    consume: jest.fn(
      async (_ex: string, _rk: string, queue: string, handler: any) => {
        handlers[queue] = handler;
      },
    ),
  };

  const buildPayload = (over: Record<string, unknown> = {}) => ({
    id: 'pet-1',
    protetorId: 'prot-1',
    nome: 'Rex',
    especie: 'cao',
    raca: null,
    porte: 'medio',
    sexo: 'macho',
    idadeMeses: 24,
    castrado: false,
    vacinado: true,
    temperamento: null,
    status: 'disponivel',
    fotosUrls: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  });

  let consumer: CatalogPetConsumer;

  beforeEach(async () => {
    jest.clearAllMocks();
    consumer = new CatalogPetConsumer(rabbitMQ as any, matchPetRepo as any);
    await consumer.onApplicationBootstrap();
  });

  it('registra os 3 consumidores nas exchanges do catalog', () => {
    expect(rabbitMQ.consume).toHaveBeenCalledTimes(3);
    expect(rabbitMQ.consume).toHaveBeenCalledWith(
      CatalogExchangeName.PET_CREATED,
      CatalogRoutingKey.PET_CREATED,
      'match.service.pet-created',
      expect.any(Function),
    );
  });

  it('pet.created → upsert na réplica', async () => {
    const payload = buildPayload();
    await handlers['match.service.pet-created'](payload);
    expect(matchPetRepo.upsert).toHaveBeenCalledWith(payload);
  });

  it('pet.updated → upsert na réplica', async () => {
    const payload = buildPayload({ status: 'adotado' });
    await handlers['match.service.pet-updated'](payload);
    expect(matchPetRepo.upsert).toHaveBeenCalledWith(payload);
  });

  it('pet.deleted → remove da réplica', async () => {
    await handlers['match.service.pet-deleted']({ id: 'pet-1' });
    expect(matchPetRepo.deleteById).toHaveBeenCalledWith('pet-1');
  });
});

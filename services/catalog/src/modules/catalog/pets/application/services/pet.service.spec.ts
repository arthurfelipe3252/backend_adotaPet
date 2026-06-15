import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PetService } from './pet.service';
import { Pet } from '../../domain/models/pet.entity';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const otherId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const petId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const buildPet = (protetorId = userId) =>
  Pet.restore({
    id: petId,
    protetorId,
    nome: 'Rex',
    especie: 'cao',
    raca: null,
    porte: 'medio',
    sexo: 'macho',
    idadeMeses: 24,
    castrado: false,
    vacinado: true,
    descricao: null,
    temperamento: null,
    status: 'disponivel',
    fotosUrls: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

describe('PetService', () => {
  const petRepository = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByProtetor: jest.fn(),
  };

  const petMessagingService = {
    publishPetCreated: jest.fn().mockResolvedValue(undefined),
    publishPetUpdated: jest.fn().mockResolvedValue(undefined),
    publishPetDeleted: jest.fn().mockResolvedValue(undefined),
  };

  const profileRepository = {
    upsert: jest.fn(),
    findById: jest.fn().mockResolvedValue(null),
    findByIds: jest.fn().mockResolvedValue(new Map()),
  };

  const service = new PetService(
    petRepository as any,
    petMessagingService as any,
    profileRepository as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates pet and publishes event', async () => {
      const createdPet = buildPet();
      petRepository.create.mockResolvedValue(createdPet);

      const dto = {
        nome: 'Rex',
        especie: 'cao' as const,
        porte: 'medio' as const,
        sexo: 'macho' as const,
        idadeMeses: 24,
        castrado: false,
        vacinado: true,
        status: 'disponivel' as const,
      };

      const result = await service.create(userId, dto as any);

      expect(petRepository.create).toHaveBeenCalledTimes(1);
      expect(petMessagingService.publishPetCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: petId }),
      );
      expect(result.id).toBe(petId);
    });
  });

  describe('findAll', () => {
    it('returns paginated { rows, total }', async () => {
      petRepository.findAll.mockResolvedValue({ rows: [buildPet()], total: 1 });

      const result = await service.findAll();

      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.rows[0].id).toBe(petId);
    });

    it('passes filters to repository', async () => {
      petRepository.findAll.mockResolvedValue({ rows: [], total: 0 });

      await service.findAll({ especie: 'gato' } as any);

      expect(petRepository.findAll).toHaveBeenCalledWith({ especie: 'gato' });
    });
  });

  describe('findById', () => {
    it('returns pet when found', async () => {
      petRepository.findById.mockResolvedValue(buildPet());

      const result = await service.findById(petId);

      expect(result.id).toBe(petId);
    });

    it('throws NotFoundException when not found', async () => {
      petRepository.findById.mockResolvedValue(null);

      await expect(service.findById(petId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByProtetor', () => {
    it('returns pets for protetor', async () => {
      petRepository.findByProtetor.mockResolvedValue([buildPet()]);

      const result = await service.findByProtetor(userId);

      expect(result).toHaveLength(1);
      expect(petRepository.findByProtetor).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when pet not found', async () => {
      petRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(petId, userId, { nome: 'Novo' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when not the owner', async () => {
      petRepository.findById.mockResolvedValue(buildPet(otherId));

      await expect(
        service.update(petId, userId, { nome: 'Novo' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates pet and publishes event', async () => {
      const pet = buildPet();
      petRepository.findById.mockResolvedValue(pet);
      petRepository.update.mockResolvedValue(undefined);

      const result = await service.update(petId, userId, { nome: 'Max' });

      expect(petRepository.update).toHaveBeenCalledTimes(1);
      expect(petMessagingService.publishPetUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ id: petId, nome: 'Max' }),
      );
      expect(result.nome).toBe('Max');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when pet not found', async () => {
      petRepository.findById.mockResolvedValue(null);

      await expect(service.delete(petId, userId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when not the owner', async () => {
      petRepository.findById.mockResolvedValue(buildPet(otherId));

      await expect(service.delete(petId, userId)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('deletes pet and publishes event', async () => {
      petRepository.findById.mockResolvedValue(buildPet());
      petRepository.delete.mockResolvedValue(undefined);

      await service.delete(petId, userId);

      expect(petRepository.delete).toHaveBeenCalledWith(petId);
      expect(petMessagingService.publishPetDeleted).toHaveBeenCalledWith(petId);
    });
  });
});

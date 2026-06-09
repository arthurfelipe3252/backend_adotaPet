import { NotFoundException } from '@nestjs/common';
import { PetService } from './pet.service';
import { PET_REPOSITORY } from '../../domain/repositories/pet-repository.interface';
import { Pet } from '../../domain/models/pet.entity';

const makePet = (overrides = {}) =>
  Pet.restore({
    id: 'uuid-1',
    protetorId: 'protetor-1',
    nome: 'Rex',
    especie: 'cao',
    porte: 'medio',
    sexo: 'macho',
    idadeMeses: 12,
    castrado: true,
    vacinado: true,
    status: 'disponivel',
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
  findByProtetor: jest.fn(),
};

const mockMessaging = {
  publishPetCreated: jest.fn().mockResolvedValue(undefined),
  publishPetUpdated: jest.fn().mockResolvedValue(undefined),
  publishPetDeleted: jest.fn().mockResolvedValue(undefined),
  onApplicationBootstrap: jest.fn(),
};

describe('PetService', () => {
  let service: PetService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PetService(mockRepo as any, mockMessaging as any);
  });

  describe('create', () => {
    it('deve criar pet e publicar evento', async () => {
      const pet = makePet();
      mockRepo.create.mockResolvedValue(pet);

      const result = await service.create({
        protetorId: 'protetor-1',
        nome: 'Rex',
        especie: 'cao',
        porte: 'medio',
        sexo: 'macho',
        idadeMeses: 12,
        castrado: true,
        vacinado: true,
      });

      expect(result.nome).toBe('Rex');
      expect(mockMessaging.publishPetCreated).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('deve retornar DTO quando pet existe', async () => {
      mockRepo.findById.mockResolvedValue(makePet());
      const result = await service.findById('uuid-1');
      expect(result.id).toBe('uuid-1');
    });

    it('deve lançar NotFoundException quando não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar campos e publicar evento', async () => {
      mockRepo.findById.mockResolvedValue(makePet());
      mockRepo.update.mockResolvedValue(undefined);

      const result = await service.update('uuid-1', { nome: 'Rex Atualizado', status: 'em_processo' });

      expect(result.nome).toBe('Rex Atualizado');
      expect(mockMessaging.publishPetUpdated).toHaveBeenCalledTimes(1);
    });

    it('deve lançar NotFoundException se pet não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.update('inexistente', { nome: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deve deletar pet e publicar evento', async () => {
      mockRepo.findById.mockResolvedValue(makePet());
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('uuid-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('uuid-1');
      expect(mockMessaging.publishPetDeleted).toHaveBeenCalledWith('uuid-1');
    });

    it('deve lançar NotFoundException se pet não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.delete('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPaginated', () => {
    it('deve retornar rows e total paginados', async () => {
      mockRepo.findAllPaginated.mockResolvedValue({ rows: [makePet()], total: 1 });
      const result = await service.listPaginated({ page: 1, limit: 10 });
      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

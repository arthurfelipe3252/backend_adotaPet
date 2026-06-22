import { PetsController } from './pets.controller';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const petId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const jwtUser = { sub: userId, protetorId: userId, permissions: ['pets:read', 'pets:write', 'pets:delete'] };
const mockPet = { id: petId, protetorId: userId, nome: 'Rex' };

describe('PetsController', () => {
  const petService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByProtetor: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const controller = new PetsController(petService as any);

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('calls service.findAll with built filters', () => {
      petService.findAll.mockResolvedValue([mockPet]);

      controller.findAll('cao', 'medio', 'disponivel', 'true', userId);

      expect(petService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ especie: 'cao', porte: 'medio', status: 'disponivel', castrado: true }),
      );
    });

    it('passes castrado=false when string is "false"', () => {
      petService.findAll.mockResolvedValue([]);

      controller.findAll(undefined, undefined, undefined, 'false', undefined);

      expect(petService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ castrado: false }),
      );
    });

    it('passes castrado=undefined when string is other value', () => {
      petService.findAll.mockResolvedValue([]);

      controller.findAll(undefined, undefined, undefined, undefined, undefined);

      expect(petService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ castrado: undefined }),
      );
    });
  });

  describe('findById', () => {
    it('calls service.findById with id', () => {
      petService.findById.mockResolvedValue(mockPet);

      controller.findById(petId);

      expect(petService.findById).toHaveBeenCalledWith(petId);
    });
  });

  describe('findByProtetor', () => {
    it('calls service.findByProtetor with protetorId', () => {
      petService.findByProtetor.mockResolvedValue([mockPet]);

      controller.findByProtetor(userId);

      expect(petService.findByProtetor).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('calls service.create with user.sub and dto', () => {
      const dto = { nome: 'Rex', especie: 'cao' };
      petService.create.mockResolvedValue(mockPet);

      controller.create(jwtUser as any, dto as any);

      expect(petService.create).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('update', () => {
    it('calls service.update with id, user.sub, dto', () => {
      const dto = { nome: 'Max' };
      petService.update.mockResolvedValue(mockPet);

      controller.update(petId, jwtUser as any, dto as any);

      expect(petService.update).toHaveBeenCalledWith(petId, userId, dto);
    });
  });

  describe('delete', () => {
    it('calls service.delete with id and user.sub', () => {
      petService.delete.mockResolvedValue(undefined);

      controller.delete(petId, jwtUser as any);

      expect(petService.delete).toHaveBeenCalledWith(petId, userId);
    });
  });
});

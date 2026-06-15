import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionarioMatchService } from './questionario-match.service';
import { QuestionarioMatch } from '@match/questionario/domain/models/questionario-match.entity';

const adotanteId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const otherId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const petId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const jwtUser = { sub: adotanteId, adotanteId, tipoUsuario: 'adotante' };

const buildQuestionario = () =>
  QuestionarioMatch.restore({
    id: 'q-id',
    adotanteId,
    tipoMoradia: 'casa_quintal_grande',
    disponibilidade: 'fica_em_casa',
    experienciaPrevia: false,
    criancasEmCasa: 'nao',
    outrosPets: 'nao',
    perfilCompanheiro: 'carinhoso',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any)!;

const salvarDto = {
  tipoMoradia: 'casa_quintal_grande',
  disponibilidade: 'fica_em_casa',
  experienciaPrevia: false,
  criancasEmCasa: 'nao',
  outrosPets: 'nao',
  perfilCompanheiro: 'carinhoso',
};

const buildMatchPetRow = (id = petId) => ({
  id,
  protetorId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
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
  fotosUrls: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('QuestionarioMatchService', () => {
  const questionarioRepo = {
    upsert: jest.fn(),
    findByAdotanteId: jest.fn(),
    deleteByAdotanteId: jest.fn(),
  };

  const matchPetRepo = {
    upsert: jest.fn(),
    deleteById: jest.fn(),
    findAvailable: jest.fn().mockResolvedValue([]),
  };

  const scoring = {
    calcularScore: jest.fn().mockReturnValue(85),
  };

  const service = new QuestionarioMatchService(
    questionarioRepo as any,
    matchPetRepo as any,
    scoring as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('salvar', () => {
    it('upserts questionario and returns response', async () => {
      const q = buildQuestionario();
      questionarioRepo.upsert.mockResolvedValue(q);

      const result = await service.salvar(jwtUser, salvarDto as any);

      expect(questionarioRepo.upsert).toHaveBeenCalledTimes(1);
      expect(result.adotanteId).toBe(adotanteId);
    });
  });

  describe('buscarMeu', () => {
    it('returns own questionario', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(buildQuestionario());

      const result = await service.buscarMeu(jwtUser);

      expect(questionarioRepo.findByAdotanteId).toHaveBeenCalledWith(adotanteId);
      expect(result.adotanteId).toBe(adotanteId);
    });

    it('throws NotFoundException when not found', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(null);

      await expect(service.buscarMeu(jwtUser)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('buscarPorAdotante', () => {
    it('throws ForbiddenException when requesting another user questionario', async () => {
      await expect(
        service.buscarPorAdotante(otherId, jwtUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns own questionario when ids match', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(buildQuestionario());

      const result = await service.buscarPorAdotante(adotanteId, jwtUser);

      expect(result.adotanteId).toBe(adotanteId);
    });
  });

  describe('calcularMeuMatch', () => {
    it('throws NotFoundException when no questionario', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(null);

      await expect(service.calcularMeuMatch(jwtUser)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('ranks available pets from the local replica', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(buildQuestionario());
      matchPetRepo.findAvailable.mockResolvedValue([buildMatchPetRow()]);

      const result = await service.calcularMeuMatch(jwtUser);

      expect(result.adotanteId).toBe(adotanteId);
      expect(result.totalPetsAnalisados).toBe(1);
      expect(result.resultados).toHaveLength(1);
      expect(result.resultados[0].petId).toBe(petId);
      expect(result.resultados[0].score).toBe(85);
      expect(result.geradoEm).toBeInstanceOf(Date);
    });
  });

  describe('calcularMatch', () => {
    it('throws ForbiddenException when requesting another user match', async () => {
      await expect(
        service.calcularMatch(otherId, jwtUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('calculates own match', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(buildQuestionario());

      const result = await service.calcularMatch(adotanteId, jwtUser);

      expect(result.adotanteId).toBe(adotanteId);
    });

    it('sorts results by score descending', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(buildQuestionario());
      matchPetRepo.findAvailable.mockResolvedValue([
        buildMatchPetRow('pet-low'),
        buildMatchPetRow('pet-high'),
      ]);
      scoring.calcularScore.mockReturnValueOnce(40).mockReturnValueOnce(90);

      const result = await service.calcularMatch(adotanteId, jwtUser);

      expect(result.resultados.map((r) => r.score)).toEqual([90, 40]);
      expect(result.resultados[0].petId).toBe('pet-high');
    });
  });

  describe('remover', () => {
    it('throws NotFoundException when no questionario to remove', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(null);

      await expect(service.remover(jwtUser)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes questionario', async () => {
      questionarioRepo.findByAdotanteId.mockResolvedValue(buildQuestionario());
      questionarioRepo.deleteByAdotanteId.mockResolvedValue(undefined);

      await service.remover(jwtUser);

      expect(questionarioRepo.deleteByAdotanteId).toHaveBeenCalledWith(adotanteId);
    });
  });
});

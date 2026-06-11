import { QuestionarioMatchController } from './questionario-match.controller';

const adotanteId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const jwtUser = { sub: adotanteId, tipoUsuario: 'adotante', permissions: [] };
const mockQuestionario = { id: 'q-id', adotanteId };
const mockResult = { adotanteId, resultados: [], geradoEm: new Date() };

describe('QuestionarioMatchController', () => {
  const service = {
    salvar: jest.fn(),
    buscarMeu: jest.fn(),
    buscarPorAdotante: jest.fn(),
    calcularMeuMatch: jest.fn(),
    calcularMatch: jest.fn(),
    remover: jest.fn(),
  };

  const controller = new QuestionarioMatchController(service as any);

  beforeEach(() => jest.clearAllMocks());

  describe('salvar', () => {
    it('delegates to service.salvar', async () => {
      const dto = { tipoMoradia: 'casa_quintal_grande' };
      service.salvar.mockResolvedValue(mockQuestionario);

      const result = await controller.salvar(jwtUser as any, dto as any);

      expect(service.salvar).toHaveBeenCalledWith(jwtUser, dto);
      expect(result).toEqual(mockQuestionario);
    });
  });

  describe('buscarMeu', () => {
    it('delegates to service.buscarMeu', async () => {
      service.buscarMeu.mockResolvedValue(mockQuestionario);

      const result = await controller.buscarMeu(jwtUser as any);

      expect(service.buscarMeu).toHaveBeenCalledWith(jwtUser);
      expect(result).toEqual(mockQuestionario);
    });
  });

  describe('buscarPorAdotante', () => {
    it('delegates to service.buscarPorAdotante', async () => {
      service.buscarPorAdotante.mockResolvedValue(mockQuestionario);

      const result = await controller.buscarPorAdotante(adotanteId, jwtUser as any);

      expect(service.buscarPorAdotante).toHaveBeenCalledWith(adotanteId, jwtUser);
      expect(result).toEqual(mockQuestionario);
    });
  });

  describe('calcularMeuMatch', () => {
    it('delegates to service.calcularMeuMatch', async () => {
      service.calcularMeuMatch.mockResolvedValue(mockResult);

      const result = await controller.calcularMeuMatch(jwtUser as any);

      expect(service.calcularMeuMatch).toHaveBeenCalledWith(jwtUser);
      expect(result).toEqual(mockResult);
    });
  });

  describe('calcularMatch', () => {
    it('delegates to service.calcularMatch', async () => {
      service.calcularMatch.mockResolvedValue(mockResult);

      const result = await controller.calcularMatch(adotanteId, jwtUser as any);

      expect(service.calcularMatch).toHaveBeenCalledWith(adotanteId, jwtUser);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remover', () => {
    it('delegates to service.remover', async () => {
      service.remover.mockResolvedValue(undefined);

      await controller.remover(jwtUser as any);

      expect(service.remover).toHaveBeenCalledWith(jwtUser);
    });
  });
});

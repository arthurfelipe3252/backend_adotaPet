import { AdotantesController } from './adotantes.controller';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const autenticado = { id: userId, tipoUsuario: TipoUsuario.Adotante, email: 'a@t.com' };
const mockResponse = { id: 'adotante-id', usuarioId: userId };

describe('AdotantesController', () => {
  const adotanteService = {
    criar: jest.fn(),
    buscarMeuPerfil: jest.fn(),
    atualizarMeuPerfil: jest.fn(),
  };

  const controller = new AdotantesController(adotanteService as any);

  beforeEach(() => jest.clearAllMocks());

  describe('criar', () => {
    it('delegates to service.criar', async () => {
      const dto = { email: 'a@t.com', senha: '123', cpf: '12345678901' };
      adotanteService.criar.mockResolvedValue(mockResponse);

      const result = await controller.criar(dto as any);

      expect(adotanteService.criar).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('buscarMe', () => {
    it('delegates to service.buscarMeuPerfil with id and tipoUsuario', async () => {
      adotanteService.buscarMeuPerfil.mockResolvedValue(mockResponse);

      const result = await controller.buscarMe(autenticado as any);

      expect(adotanteService.buscarMeuPerfil).toHaveBeenCalledWith(userId, TipoUsuario.Adotante);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('atualizarMe', () => {
    it('delegates to service.atualizarMeuPerfil', async () => {
      const dto = { nome: 'Novo Nome' };
      adotanteService.atualizarMeuPerfil.mockResolvedValue(mockResponse);

      const result = await controller.atualizarMe(autenticado as any, dto as any);

      expect(adotanteService.atualizarMeuPerfil).toHaveBeenCalledWith(
        userId,
        TipoUsuario.Adotante,
        dto,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

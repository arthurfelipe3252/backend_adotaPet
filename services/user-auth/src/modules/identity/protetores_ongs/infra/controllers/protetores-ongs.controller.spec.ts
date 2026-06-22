import { ProtetoresOngsController } from './protetores-ongs.controller';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const autenticado = { id: userId, tipoUsuario: TipoUsuario.Protetor, email: 'p@t.com' };
const mockResponse = { id: 'protetor-id', usuarioId: userId };

describe('ProtetoresOngsController', () => {
  const protetorOngService = {
    criar: jest.fn(),
    buscarMeuPerfil: jest.fn(),
    atualizarMeuPerfil: jest.fn(),
  };

  const controller = new ProtetoresOngsController(protetorOngService as any);

  beforeEach(() => jest.clearAllMocks());

  describe('criar', () => {
    it('delegates to service.criar', async () => {
      const dto = {
        email: 'p@t.com',
        senha: '123',
        cpfCnpj: '98765432100',
        tipoUsuario: 'protetor',
        documentoComprobatorio: 'base64doc',
      };
      protetorOngService.criar.mockResolvedValue(mockResponse);

      const result = await controller.criar(dto as any);

      expect(protetorOngService.criar).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('buscarMe', () => {
    it('delegates to service.buscarMeuPerfil with id and tipoUsuario', async () => {
      protetorOngService.buscarMeuPerfil.mockResolvedValue(mockResponse);

      const result = await controller.buscarMe(autenticado as any);

      expect(protetorOngService.buscarMeuPerfil).toHaveBeenCalledWith(userId, TipoUsuario.Protetor);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('atualizarMe', () => {
    it('delegates to service.atualizarMeuPerfil', async () => {
      const dto = { descricao: 'Nova desc' };
      protetorOngService.atualizarMeuPerfil.mockResolvedValue(mockResponse);

      const result = await controller.atualizarMe(autenticado as any, dto as any);

      expect(protetorOngService.atualizarMeuPerfil).toHaveBeenCalledWith(
        userId,
        TipoUsuario.Protetor,
        dto,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

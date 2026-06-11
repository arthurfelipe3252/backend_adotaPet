import { UsuariosController } from './usuarios.controller';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario-response.dto';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const autenticado = { id: userId, tipoUsuario: 'adotante', email: 'u@t.com' };
const mockUsuarioResponse = { id: userId, nome: 'Joao', email: 'u@t.com' } as UsuarioResponseDto;

describe('UsuariosController', () => {
  const usuarioService = {
    buscarPorId: jest.fn(),
    buscarPerfilProprio: jest.fn(),
    atualizar: jest.fn(),
    alterarSenha: jest.fn(),
    desativar: jest.fn(),
  };

  const buildMockUsuario = () => ({
    id: userId,
    nome: 'Joao',
    email: 'u@t.com',
    tipoUsuario: 'adotante',
    ativo: true,
    telefone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  jest.spyOn(UsuarioResponseDto, 'deUsuario').mockReturnValue(mockUsuarioResponse as any);

  const controller = new UsuariosController(usuarioService as any);

  beforeEach(() => jest.clearAllMocks());

  describe('buscarPerfilProprio', () => {
    it('calls service with autenticado.id', async () => {
      usuarioService.buscarPerfilProprio.mockResolvedValue(buildMockUsuario());

      await controller.buscarPerfilProprio(autenticado as any);

      expect(usuarioService.buscarPerfilProprio).toHaveBeenCalledWith(userId);
    });
  });

  describe('buscarPorId', () => {
    it('calls service with id and autenticado.id', async () => {
      usuarioService.buscarPorId.mockResolvedValue(buildMockUsuario());

      await controller.buscarPorId(userId, autenticado as any);

      expect(usuarioService.buscarPorId).toHaveBeenCalledWith(userId, userId);
    });
  });

  describe('atualizar', () => {
    it('calls service with id, dto, and autenticado.id', async () => {
      const dto = { nome: 'Novo Nome' };
      usuarioService.atualizar.mockResolvedValue(buildMockUsuario());

      await controller.atualizar(userId, dto as any, autenticado as any);

      expect(usuarioService.atualizar).toHaveBeenCalledWith(userId, dto, userId);
    });
  });

  describe('alterarSenha', () => {
    it('calls service with autenticado.id and dto', async () => {
      const dto = { senhaAtual: 'old', senhaNova: 'new123' };
      usuarioService.alterarSenha.mockResolvedValue(buildMockUsuario());

      await controller.alterarSenha(autenticado as any, dto as any);

      expect(usuarioService.alterarSenha).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('desativar', () => {
    it('calls service with id and autenticado.id', async () => {
      usuarioService.desativar.mockResolvedValue(undefined);

      await controller.desativar(userId, autenticado as any);

      expect(usuarioService.desativar).toHaveBeenCalledWith(userId, userId);
    });
  });
});

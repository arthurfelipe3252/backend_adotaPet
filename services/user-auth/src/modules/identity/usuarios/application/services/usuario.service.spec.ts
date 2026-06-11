import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const otherId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const buildUsuario = (id = userId, ativo = true) =>
  Usuario.restaurar({
    id,
    nome: 'Joao',
    email: 'joao@test.com',
    senhaHash: '$hashed$',
    telefone: null,
    tipoUsuario: TipoUsuario.Adotante,
    ativo,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

describe('UsuarioService', () => {
  const usuarioRepository = {
    buscarPorEmail: jest.fn(),
    buscarPorId: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    desativar: jest.fn(),
  };

  const passwordHasher = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const refreshTokenRepository = {
    revokeAllForUser: jest.fn(),
  };

  const service = new UsuarioService(
    usuarioRepository as any,
    passwordHasher as any,
    refreshTokenRepository as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('buscarPorId', () => {
    it('throws ForbiddenException when requesting another user', async () => {
      await expect(service.buscarPorId(otherId, userId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when user not found', async () => {
      usuarioRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarPorId(userId, userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns user when found and authorized', async () => {
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());

      const result = await service.buscarPorId(userId, userId);

      expect(result).toBeDefined();
      expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(userId);
    });
  });

  describe('buscarPerfilProprio', () => {
    it('returns user without authorization check', async () => {
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());

      const result = await service.buscarPerfilProprio(userId);

      expect(result.id).toBe(userId);
    });

    it('throws NotFoundException when user inactive', async () => {
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario(userId, false));

      await expect(service.buscarPerfilProprio(userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('atualizar', () => {
    it('throws ForbiddenException when updating another user', async () => {
      await expect(
        service.atualizar(otherId, { nome: 'X' }, userId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates and returns the user', async () => {
      const usuario = buildUsuario();
      usuarioRepository.buscarPorId.mockResolvedValue(usuario);
      usuarioRepository.atualizar.mockResolvedValue(usuario);

      const result = await service.atualizar(userId, { nome: 'Novo Nome' }, userId);

      expect(usuarioRepository.atualizar).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });

  describe('alterarSenha', () => {
    it('throws UnauthorizedException when current password is wrong', async () => {
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        service.alterarSenha(userId, { senhaAtual: 'wrong', senhaNova: 'new123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates password hash on success', async () => {
      const usuario = buildUsuario();
      usuarioRepository.buscarPorId.mockResolvedValue(usuario);
      passwordHasher.compare.mockResolvedValue(true);
      passwordHasher.hash.mockResolvedValue('$new-hash$');
      usuarioRepository.atualizar.mockResolvedValue(usuario);

      await service.alterarSenha(userId, { senhaAtual: 'correct', senhaNova: 'new123' });

      expect(passwordHasher.hash).toHaveBeenCalledWith('new123');
      expect(usuarioRepository.atualizar).toHaveBeenCalledTimes(1);
    });
  });

  describe('desativar', () => {
    it('throws ForbiddenException when deactivating another user', async () => {
      await expect(service.desativar(otherId, userId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when user not found', async () => {
      usuarioRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.desativar(userId, userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deactivates user and revokes all tokens', async () => {
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());
      usuarioRepository.desativar.mockResolvedValue(undefined);
      refreshTokenRepository.revokeAllForUser.mockResolvedValue(undefined);

      await service.desativar(userId, userId);

      expect(usuarioRepository.desativar).toHaveBeenCalledWith(userId);
      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(userId);
    });
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import { RefreshToken } from '@identity/usuarios/domain/models/refresh-token.entity';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const buildUsuario = (overrides: Partial<{ ativo: boolean }> = {}) =>
  Usuario.restaurar({
    id: userId,
    nome: 'Teste User',
    email: 'user@test.com',
    senhaHash: '$hashed',
    telefone: null,
    tipoUsuario: TipoUsuario.Adotante,
    ativo: overrides.ativo ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const buildRefreshToken = (valid = true) =>
  RefreshToken.restore({
    id: 'rtid-0000',
    usuarioId: userId,
    tokenHash: 'hashvalue',
    expiresAt: valid ? new Date(Date.now() + 86400_000) : new Date(Date.now() - 1000),
    revokedAt: null,
    userAgent: 'test-agent',
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
  })!;

const meta = { userAgent: 'Jest/1.0', ipAddress: '127.0.0.1' };

describe('AuthService', () => {
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
    create: jest.fn(),
    findByHash: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('mock.access.token'),
  };

  const configService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return undefined;
    }),
  };

  const service = new AuthService(
    usuarioRepository as any,
    passwordHasher as any,
    refreshTokenRepository as any,
    jwtService as any,
    configService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('throws when email not found', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', senha: '123' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when user is inactive', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(buildUsuario({ ativo: false }));

      await expect(
        service.login({ email: 'user@test.com', senha: '123' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when password is wrong', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(buildUsuario());
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@test.com', senha: 'wrong' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns access + refresh tokens on success', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(buildUsuario());
      passwordHasher.compare.mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue(undefined);

      const result = await service.login({ email: 'user@test.com', senha: 'correct' }, meta);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(refreshTokenRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('throws when token not found', async () => {
      refreshTokenRepository.findByHash.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'invalid-token' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when token is expired', async () => {
      refreshTokenRepository.findByHash.mockResolvedValue(buildRefreshToken(false));

      await expect(
        service.refresh({ refreshToken: 'expired-token' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when user not found after token lookup', async () => {
      refreshTokenRepository.findByHash.mockResolvedValue(buildRefreshToken(true));
      usuarioRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'valid-token' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rotates tokens on success', async () => {
      refreshTokenRepository.findByHash.mockResolvedValue(buildRefreshToken(true));
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());
      refreshTokenRepository.rotate.mockResolvedValue(undefined);

      const result = await service.refresh({ refreshToken: 'valid-token' }, meta);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(refreshTokenRepository.rotate).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('revokes token when found', async () => {
      const stored = buildRefreshToken(true);
      refreshTokenRepository.findByHash.mockResolvedValue(stored);
      refreshTokenRepository.revoke.mockResolvedValue(undefined);

      await service.logout('some-refresh-token');

      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(stored.id);
    });

    it('is idempotent when token not found', async () => {
      refreshTokenRepository.findByHash.mockResolvedValue(null);

      await expect(service.logout('ghost-token')).resolves.toBeUndefined();
      expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('revokes all tokens for user', async () => {
      refreshTokenRepository.revokeAllForUser.mockResolvedValue(undefined);

      await service.logoutAll(userId);

      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(userId);
    });
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { ForgotPasswordService } from './forgot-password.service';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import { PasswordResetToken } from '@identity/usuarios/domain/models/password-reset-token.entity';
import { beforeEach, describe, it } from 'node:test';
import expect from 'expect';
import { jest } from '@jest/globals';

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

const buildResetToken = (valid = true) =>
  PasswordResetToken.restore({
    id: 'rt-0000',
    usuarioId: userId,
    tokenHash: 'hashvalue',
    expiresAt: valid
      ? new Date(Date.now() + 1_800_000)
      : new Date(Date.now() - 1000),
    usedAt: null,
    createdAt: new Date(),
  })!;

describe('ForgotPasswordService', () => {
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

  const resetTokenRepository = {
    create: jest.fn(),
    findByHash: jest.fn(),
    markAsUsed: jest.fn(),
    invalidateAllForUser: jest.fn(),
  };

  const refreshTokenRepository = {
    create: jest.fn(),
    findByHash: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };

  const emailSender = {
    sendPasswordResetEmail: jest.fn(),
  };

  const configService = {
    get: jest
      .fn<(key: string) => string | undefined>()
      .mockImplementation((key: string) => {
        if (key === 'PASSWORD_RESET_TOKEN_EXPIRES_IN') return '30m';
        if (key === 'FRONTEND_RESET_URL')
          return 'http://localhost:3000/reset-password';
        return undefined;
      }),
  };

  const service = new ForgotPasswordService(
    usuarioRepository as any,
    passwordHasher as any,
    resetTokenRepository as any,
    refreshTokenRepository as any,
    emailSender as any,
    configService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('requestReset', () => {
    it('does nothing (no throw, no email) when email does not exist', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(null);

      await service.requestReset({ email: 'naoexiste@test.com' });

      expect(emailSender.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(resetTokenRepository.create).not.toHaveBeenCalled();
    });

    it('does nothing when user is inactive', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(
        buildUsuario({ ativo: false }),
      );

      await service.requestReset({ email: 'user@test.com' });

      expect(emailSender.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('invalidates previous tokens, creates a new one and sends email when user exists', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(buildUsuario());
      resetTokenRepository.create.mockResolvedValue(undefined);

      await service.requestReset({ email: 'user@test.com' });

      expect(resetTokenRepository.invalidateAllForUser).toHaveBeenCalledWith(
        userId,
      );
      expect(resetTokenRepository.create).toHaveBeenCalledTimes(1);
      expect(emailSender.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const callArgs = emailSender.sendPasswordResetEmail.mock.calls[0][0];
      expect(callArgs.to).toBe('user@test.com');
      expect(callArgs.resetUrl).toContain(
        'http://localhost:3000/reset-password?token=',
      );
    });
  });

  describe('confirmReset', () => {
    it('throws when token is not found', async () => {
      resetTokenRepository.findByHash.mockResolvedValue(null);

      await expect(
        service.confirmReset({ token: 'invalid', novaSenha: 'novaSenha123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when token is expired', async () => {
      resetTokenRepository.findByHash.mockResolvedValue(buildResetToken(false));

      await expect(
        service.confirmReset({ token: 'expired', novaSenha: 'novaSenha123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when user no longer exists or is inactive', async () => {
      resetTokenRepository.findByHash.mockResolvedValue(buildResetToken());
      usuarioRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.confirmReset({ token: 'valid', novaSenha: 'novaSenha123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates password, marks token used and revokes all sessions on success', async () => {
      resetTokenRepository.findByHash.mockResolvedValue(buildResetToken());
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());
      passwordHasher.hash.mockResolvedValue('$newHashed');
      usuarioRepository.atualizar.mockResolvedValue(undefined);

      await service.confirmReset({
        token: 'valid-token',
        novaSenha: 'novaSenhaSegura456',
      });

      expect(passwordHasher.hash).toHaveBeenCalledWith('novaSenhaSegura456');
      expect(usuarioRepository.atualizar).toHaveBeenCalledTimes(1);
      expect(resetTokenRepository.markAsUsed).toHaveBeenCalledWith('rt-0000');
      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
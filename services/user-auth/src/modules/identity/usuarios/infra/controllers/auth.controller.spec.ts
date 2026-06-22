import { AuthController } from './auth.controller';
import type { Request } from 'express';

const mockRequest = {
  headers: { 'user-agent': 'Jest/1.0' },
  ip: '127.0.0.1',
} as unknown as Request;

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  const controller = new AuthController(authService as any);

  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('delegates to authService.login with extracted meta', async () => {
      const dto = { email: 'user@test.com', senha: '123' };
      const expected = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900, user: {} };
      authService.login.mockResolvedValue(expected);

      const result = await controller.login(dto as any, mockRequest);

      expect(authService.login).toHaveBeenCalledWith(dto, {
        userAgent: 'Jest/1.0',
        ipAddress: '127.0.0.1',
      });
      expect(result).toEqual(expected);
    });
  });

  describe('refresh', () => {
    it('delegates to authService.refresh', async () => {
      const dto = { refreshToken: 'rt-value' };
      const expected = { accessToken: 'at2', refreshToken: 'rt2', expiresIn: 900, user: {} };
      authService.refresh.mockResolvedValue(expected);

      const result = await controller.refresh(dto as any, mockRequest);

      expect(authService.refresh).toHaveBeenCalledWith(dto, {
        userAgent: 'Jest/1.0',
        ipAddress: '127.0.0.1',
      });
      expect(result).toEqual(expected);
    });
  });

  describe('logout', () => {
    it('delegates to authService.logout with refreshToken from body', async () => {
      const dto = { refreshToken: 'rt-to-revoke' };
      authService.logout.mockResolvedValue(undefined);

      await controller.logout(dto as any);

      expect(authService.logout).toHaveBeenCalledWith('rt-to-revoke');
    });
  });

  describe('logoutAll', () => {
    it('delegates to authService.logoutAll with user id', async () => {
      const autenticado = { id: 'user-id-001', tipoUsuario: 'adotante' };
      authService.logoutAll.mockResolvedValue(undefined);

      await controller.logoutAll(autenticado as any);

      expect(authService.logoutAll).toHaveBeenCalledWith('user-id-001');
    });
  });
});

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const mockReflector = { getAllAndOverride: jest.fn() };
const mockJwtService = { verify: jest.fn() };
const mockConfigService = { getOrThrow: jest.fn().mockReturnValue('super-secret') };

const makeContext = (authHeader?: string, handler = {}, classRef = {}): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => classRef,
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: authHeader } }),
    }),
  } as unknown as ExecutionContext);

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(
      mockReflector as any,
      mockJwtService as any,
      mockConfigService as any,
    );
  });

  it('deve permitir rotas @Public() sem token', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const result = guard.canActivate(makeContext());
    expect(result).toBe(true);
  });

  it('deve lançar UnauthorizedException se sem token em rota protegida', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    expect(() => guard.canActivate(makeContext())).toThrow(UnauthorizedException);
  });

  it('deve lançar UnauthorizedException se token inválido', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

    expect(() => guard.canActivate(makeContext('Bearer token.invalido'))).toThrow(UnauthorizedException);
  });

  it('deve retornar true e setar request.user com token válido', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const payload = { sub: 'uuid-1', email: 'a@a.com', tipoUsuario: 'adotante', permissions: [] };
    mockJwtService.verify.mockReturnValue(payload);

    const request: Record<string, unknown> = { headers: { authorization: 'Bearer valid.token' } };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(request['user']).toMatchObject({ id: 'uuid-1', email: 'a@a.com' });
  });
});

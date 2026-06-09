import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token-repository.interface';
import { PASSWORD_HASHER } from '../../domain/ports/password-hasher.interface';
import { Usuario } from '../../domain/models/usuario.entity';
import { RefreshToken } from '../../domain/models/refresh-token.entity';

const mockUsuarioRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  findAll: jest.fn(),
  findAllPaginated: jest.fn(),
};

const mockRefreshTokenRepo = {
  create: jest.fn(),
  update: jest.fn(),
  findByHash: jest.fn(),
  revokeAllByUsuario: jest.fn(),
};

const mockPasswordHasher = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('jwt.token.here'),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('super-secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockUsuarioRepo as any,
      mockRefreshTokenRepo as any,
      mockPasswordHasher as any,
      mockJwtService as any,
      mockConfigService as any,
    );
  });

  describe('login', () => {
    it('deve retornar tokens quando credenciais válidas', async () => {
      const usuario = Usuario.restore({
        id: 'uuid-1',
        nome: 'João',
        email: 'joao@email.com',
        senhaHash: 'hash',
        tipoUsuario: 'adotante',
        ativo: true,
      })!;

      mockUsuarioRepo.findByEmail.mockResolvedValue(usuario);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockRefreshTokenRepo.create.mockResolvedValue(undefined);

      const result = await service.login({ email: 'joao@email.com', senha: '123456' });

      expect(result.accessToken).toBe('jwt.token.here');
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(900);
    });

    it('deve lançar UnauthorizedException se usuário não encontrado', async () => {
      mockUsuarioRepo.findByEmail.mockResolvedValue(null);

      await expect(service.login({ email: 'nao@existe.com', senha: '123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se usuário inativo', async () => {
      const usuario = Usuario.restore({
        id: 'uuid-1', nome: 'João', email: 'joao@email.com',
        senhaHash: 'hash', tipoUsuario: 'adotante', ativo: false,
      })!;
      mockUsuarioRepo.findByEmail.mockResolvedValue(usuario);

      await expect(service.login({ email: 'joao@email.com', senha: '123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha incorreta', async () => {
      const usuario = Usuario.restore({
        id: 'uuid-1', nome: 'João', email: 'joao@email.com',
        senhaHash: 'hash', tipoUsuario: 'adotante', ativo: true,
      })!;
      mockUsuarioRepo.findByEmail.mockResolvedValue(usuario);
      mockPasswordHasher.compare.mockResolvedValue(false);

      await expect(service.login({ email: 'joao@email.com', senha: 'errada' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('deve revogar todos os refresh tokens do usuário', async () => {
      mockRefreshTokenRepo.revokeAllByUsuario.mockResolvedValue(undefined);

      await service.logout('uuid-1');

      expect(mockRefreshTokenRepo.revokeAllByUsuario).toHaveBeenCalledWith('uuid-1');
    });
  });
});

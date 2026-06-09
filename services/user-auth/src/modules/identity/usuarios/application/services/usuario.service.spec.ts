import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario-repository.interface';
import { PASSWORD_HASHER } from '../../domain/ports/password-hasher.interface';
import { Usuario } from '../../domain/models/usuario.entity';
import type { AuthenticatedUser } from '@shared/infra/decorators/current-user.decorator';

const mockRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  findAll: jest.fn(),
  findAllPaginated: jest.fn(),
};

const mockHasher = {
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
};

const adminUser: AuthenticatedUser = {
  id: 'admin-id', email: 'admin@email.com', tipoUsuario: 'admin', permissions: [],
};

const selfUser: AuthenticatedUser = {
  id: 'uuid-1', email: 'user@email.com', tipoUsuario: 'adotante', permissions: [],
};

const otherUser: AuthenticatedUser = {
  id: 'other-id', email: 'other@email.com', tipoUsuario: 'adotante', permissions: [],
};

describe('UsuarioService', () => {
  let service: UsuarioService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsuarioService(mockRepo as any, mockHasher as any);
  });

  describe('create', () => {
    it('deve criar usuário e retornar DTO sem senhaHash', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(undefined);

      const result = await service.create({
        nome: 'João', email: 'joao@email.com', senha: '123456', tipoUsuario: 'adotante',
      });

      expect(result.email).toBe('joao@email.com');
      expect((result as any).senhaHash).toBeUndefined();
    });

    it('deve lançar ConflictException se email já existe', async () => {
      const existing = Usuario.create({ nome: 'X', email: 'joao@email.com', senhaHash: 'h', tipoUsuario: 'adotante' });
      mockRepo.findByEmail.mockResolvedValue(existing);

      await expect(service.create({ nome: 'João', email: 'joao@email.com', senha: '123', tipoUsuario: 'adotante' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('deve retornar DTO quando usuário existe', async () => {
      const usuario = Usuario.restore({ id: 'uuid-1', nome: 'João', email: 'j@j.com', senhaHash: 'h', tipoUsuario: 'adotante', ativo: true })!;
      mockRepo.findById.mockResolvedValue(usuario);

      const result = await service.findById('uuid-1');
      expect(result.id).toBe('uuid-1');
    });

    it('deve lançar NotFoundException se não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve permitir admin editar qualquer usuário', async () => {
      const usuario = Usuario.restore({ id: 'uuid-1', nome: 'Antigo', email: 'a@a.com', senhaHash: 'h', tipoUsuario: 'adotante', ativo: true })!;
      mockRepo.findById.mockResolvedValue(usuario);
      mockRepo.update.mockResolvedValue(undefined);

      const result = await service.update('uuid-1', { nome: 'Novo' }, adminUser);
      expect(result.nome).toBe('Novo');
    });

    it('deve permitir usuário editar a si mesmo', async () => {
      const usuario = Usuario.restore({ id: 'uuid-1', nome: 'Antigo', email: 'a@a.com', senhaHash: 'h', tipoUsuario: 'adotante', ativo: true })!;
      mockRepo.findById.mockResolvedValue(usuario);
      mockRepo.update.mockResolvedValue(undefined);

      await expect(service.update('uuid-1', { nome: 'Novo' }, selfUser)).resolves.not.toThrow();
    });

    it('deve lançar ForbiddenException se tentar editar outro usuário', async () => {
      const usuario = Usuario.restore({ id: 'uuid-1', nome: 'Antigo', email: 'a@a.com', senhaHash: 'h', tipoUsuario: 'adotante', ativo: true })!;
      mockRepo.findById.mockResolvedValue(usuario);

      await expect(service.update('uuid-1', { nome: 'Hack' }, otherUser))
        .rejects.toThrow(ForbiddenException);
    });
  });
});

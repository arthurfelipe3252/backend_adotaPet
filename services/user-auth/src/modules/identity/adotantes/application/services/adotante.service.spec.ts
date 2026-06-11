import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdotanteService } from './adotante.service';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const adotanteId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const enderecoId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const buildUsuario = () =>
  Usuario.restaurar({
    id: userId,
    nome: 'Joao',
    email: 'joao@test.com',
    senhaHash: '$hashed$',
    telefone: null,
    tipoUsuario: TipoUsuario.Adotante,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const buildEndereco = () =>
  Endereco.restaurar({
    id: enderecoId,
    logradouro: 'Rua A',
    numero: '100',
    complemento: null,
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001000',
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const buildAdotante = () =>
  Adotante.restaurar({
    id: adotanteId,
    usuarioId: userId,
    cpf: '12345678901',
    enderecoId,
    imagemBase64: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const criardto = {
  nome: 'Joao',
  email: 'joao@test.com',
  senha: 'pass123',
  telefone: null,
  cpf: '12345678901',
  imagemBase64: null,
  endereco: {
    logradouro: 'Rua A',
    numero: '100',
    complemento: null,
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001000',
  },
};

describe('AdotanteService', () => {
  const drizzle = {
    db: {
      transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({}),
      ),
    },
  };

  const usuarioRepository = {
    buscarPorEmail: jest.fn(),
    buscarPorId: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
  };

  const adotanteRepository = {
    buscarPorCpf: jest.fn(),
    buscarPorUsuarioId: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
  };

  const enderecoRepository = {
    criar: jest.fn(),
    atualizar: jest.fn(),
    buscarPorId: jest.fn(),
  };

  const passwordHasher = {
    hash: jest.fn().mockResolvedValue('$hashed$'),
    compare: jest.fn(),
  };

  const service = new AdotanteService(
    drizzle as any,
    usuarioRepository as any,
    adotanteRepository as any,
    enderecoRepository as any,
    passwordHasher as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('criar', () => {
    it('throws ConflictException when email already used', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(buildUsuario());

      await expect(service.criar(criardto as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws ConflictException when CPF already used', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(null);
      adotanteRepository.buscarPorCpf.mockResolvedValue(buildAdotante());

      await expect(service.criar(criardto as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates adotante atomically on success', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(null);
      adotanteRepository.buscarPorCpf.mockResolvedValue(null);
      enderecoRepository.criar.mockResolvedValue(buildEndereco());
      usuarioRepository.criar.mockResolvedValue(buildUsuario());
      adotanteRepository.criar.mockResolvedValue(buildAdotante());

      const result = await service.criar(criardto as any);

      expect(drizzle.db.transaction).toHaveBeenCalledTimes(1);
      expect(enderecoRepository.criar).toHaveBeenCalledTimes(1);
      expect(usuarioRepository.criar).toHaveBeenCalledTimes(1);
      expect(adotanteRepository.criar).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });

  describe('buscarMeuPerfil', () => {
    it('throws ForbiddenException for non-adotante user', async () => {
      await expect(
        service.buscarMeuPerfil(userId, TipoUsuario.Protetor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when adotante profile not found', async () => {
      adotanteRepository.buscarPorUsuarioId.mockResolvedValue(null);

      await expect(
        service.buscarMeuPerfil(userId, TipoUsuario.Adotante),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns full profile on success', async () => {
      adotanteRepository.buscarPorUsuarioId.mockResolvedValue(buildAdotante());
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());
      enderecoRepository.buscarPorId.mockResolvedValue(buildEndereco());

      const result = await service.buscarMeuPerfil(userId, TipoUsuario.Adotante);

      expect(result).toBeDefined();
    });
  });

  describe('atualizarMeuPerfil', () => {
    it('throws ForbiddenException for non-adotante user', async () => {
      await expect(
        service.atualizarMeuPerfil(userId, TipoUsuario.Protetor, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when adotante profile not found', async () => {
      adotanteRepository.buscarPorUsuarioId.mockResolvedValue(null);

      await expect(
        service.atualizarMeuPerfil(userId, TipoUsuario.Adotante, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates profile on success', async () => {
      const adotante = buildAdotante();
      const usuario = buildUsuario();
      adotanteRepository.buscarPorUsuarioId.mockResolvedValue(adotante);
      usuarioRepository.buscarPorId.mockResolvedValue(usuario);
      enderecoRepository.buscarPorId.mockResolvedValue(buildEndereco());
      usuarioRepository.atualizar.mockResolvedValue(usuario);
      adotanteRepository.atualizar.mockResolvedValue(adotante);

      const result = await service.atualizarMeuPerfil(userId, TipoUsuario.Adotante, {
        nome: 'Novo Nome',
      });

      expect(drizzle.db.transaction).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });
});

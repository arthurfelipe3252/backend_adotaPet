import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProtetorOngService } from './protetor-ong.service';
import { ProtetorOng } from '@identity/protetores_ongs/domain/models/protetor-ong.entity';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const protetorId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const enderecoId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const buildUsuario = (tipo: TipoUsuario = TipoUsuario.Protetor) =>
  Usuario.restaurar({
    id: userId,
    nome: 'Ana',
    email: 'ana@test.com',
    senhaHash: '$h$',
    telefone: null,
    tipoUsuario: tipo,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const buildEndereco = () =>
  Endereco.restaurar({
    id: enderecoId,
    logradouro: 'Av B',
    numero: '50',
    complemento: null,
    bairro: 'Vila',
    cidade: 'RJ',
    estado: 'RJ',
    cep: '20000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const buildProtetorOng = () =>
  ProtetorOng.restaurar({
    id: protetorId,
    usuarioId: userId,
    cpfCnpj: '98765432100',
    descricao: 'ONG Amigos',
    telefoneContato: null,
    imagemBase64: null,
    documentoComprobatorio: 'doc-base64',
    enderecoId,
    createdAt: new Date(),
    updatedAt: new Date(),
  })!;

const criarDto = {
  nome: 'Ana',
  email: 'ana@test.com',
  senha: 'pass123',
  telefone: null,
  tipoUsuario: 'protetor' as const,
  cpfCnpj: '98765432100',
  descricao: 'ONG Amigos',
  telefoneContato: null,
  documentoComprobatorio: 'doc-base64',
  imagemBase64: null,
  endereco: {
    logradouro: 'Av B',
    numero: '50',
    complemento: null,
    bairro: 'Vila',
    cidade: 'RJ',
    estado: 'RJ',
    cep: '20000000',
  },
};

describe('ProtetorOngService', () => {
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

  const protetorOngRepository = {
    buscarPorCpfCnpj: jest.fn(),
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

  const userMessaging = {
    publishProfileCreated: jest.fn().mockResolvedValue(undefined),
    publishProfileUpdated: jest.fn().mockResolvedValue(undefined),
  };

  const service = new ProtetorOngService(
    drizzle as any,
    usuarioRepository as any,
    protetorOngRepository as any,
    enderecoRepository as any,
    passwordHasher as any,
    userMessaging as any,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('criar', () => {
    it('throws ConflictException when email already used', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(buildUsuario());

      await expect(service.criar(criarDto as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws ConflictException when CPF/CNPJ already used', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(null);
      protetorOngRepository.buscarPorCpfCnpj.mockResolvedValue(buildProtetorOng());

      await expect(service.criar(criarDto as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates protetor/ong atomically on success', async () => {
      usuarioRepository.buscarPorEmail.mockResolvedValue(null);
      protetorOngRepository.buscarPorCpfCnpj.mockResolvedValue(null);
      enderecoRepository.criar.mockResolvedValue(buildEndereco());
      usuarioRepository.criar.mockResolvedValue(buildUsuario());
      protetorOngRepository.criar.mockResolvedValue(buildProtetorOng());

      const result = await service.criar(criarDto as any);

      expect(drizzle.db.transaction).toHaveBeenCalledTimes(1);
      expect(enderecoRepository.criar).toHaveBeenCalledTimes(1);
      expect(usuarioRepository.criar).toHaveBeenCalledTimes(1);
      expect(protetorOngRepository.criar).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });

  describe('buscarMeuPerfil', () => {
    it('throws ForbiddenException for adotante user', async () => {
      await expect(
        service.buscarMeuPerfil(userId, TipoUsuario.Adotante),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when profile not found', async () => {
      protetorOngRepository.buscarPorUsuarioId.mockResolvedValue(null);

      await expect(
        service.buscarMeuPerfil(userId, TipoUsuario.Protetor),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns full profile for protetor', async () => {
      protetorOngRepository.buscarPorUsuarioId.mockResolvedValue(buildProtetorOng());
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario());
      enderecoRepository.buscarPorId.mockResolvedValue(buildEndereco());

      const result = await service.buscarMeuPerfil(userId, TipoUsuario.Protetor);

      expect(result).toBeDefined();
    });

    it('returns full profile for ong', async () => {
      protetorOngRepository.buscarPorUsuarioId.mockResolvedValue(buildProtetorOng());
      usuarioRepository.buscarPorId.mockResolvedValue(buildUsuario(TipoUsuario.Ong));
      enderecoRepository.buscarPorId.mockResolvedValue(buildEndereco());

      const result = await service.buscarMeuPerfil(userId, TipoUsuario.Ong);

      expect(result).toBeDefined();
    });
  });

  describe('atualizarMeuPerfil', () => {
    it('throws ForbiddenException for adotante user', async () => {
      await expect(
        service.atualizarMeuPerfil(userId, TipoUsuario.Adotante, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when profile not found', async () => {
      protetorOngRepository.buscarPorUsuarioId.mockResolvedValue(null);

      await expect(
        service.atualizarMeuPerfil(userId, TipoUsuario.Protetor, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates profile on success', async () => {
      const protetor = buildProtetorOng();
      const usuario = buildUsuario();
      protetorOngRepository.buscarPorUsuarioId.mockResolvedValue(protetor);
      usuarioRepository.buscarPorId.mockResolvedValue(usuario);
      enderecoRepository.buscarPorId.mockResolvedValue(buildEndereco());
      usuarioRepository.atualizar.mockResolvedValue(usuario);
      protetorOngRepository.atualizar.mockResolvedValue(protetor);

      const result = await service.atualizarMeuPerfil(userId, TipoUsuario.Protetor, {
        descricao: 'Nova desc',
      });

      expect(drizzle.db.transaction).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });
});

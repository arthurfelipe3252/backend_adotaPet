import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import { ProtetorOng } from '@identity/protetores-ongs/domain/models/protetor-ong.entity';
import {
  PROTETOR_ONG_REPOSITORY,
  type ProtetorOngRepository,
} from '@identity/protetores-ongs/domain/repositories/protetor-ong-repository.interface';
import {
  ENDERECO_REPOSITORY,
  type EnderecoRepository,
} from '@identity/enderecos/domain/repositories/endereco-repository.interface';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@identity/usuarios/domain/ports/password-hasher.interface';
import { EnderecoResponseDto } from '@identity/enderecos/application/dto/endereco.dto';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario.dto';
import {
  ProtetorOngResponseDto,
  type CreateProtetorOngDto,
  type UpdateProtetorOngDto,
} from '../dto/protetor-ong.dto';
import { ProtetorOngMessagingService } from './protetor-ong-messaging.service';

@Injectable()
export class ProtetorOngService {
  constructor(
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorRepository: ProtetorOngRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: EnderecoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly messagingService: ProtetorOngMessagingService,
  ) {}

  async create(dto: CreateProtetorOngDto): Promise<ProtetorOngResponseDto> {
    const emailExists = await this.usuarioRepository.findByEmail(dto.usuario.email);
    if (emailExists) throw new ConflictException('Email já cadastrado');

    const senhaHash = await this.passwordHasher.hash(dto.usuario.senha);
    const usuario = Usuario.create({
      nome: dto.usuario.nome,
      email: dto.usuario.email,
      senhaHash,
      telefone: dto.usuario.telefone ?? null,
      tipoUsuario: 'protetor_ong',
    });
    await this.usuarioRepository.create(usuario);

    const enderecoEntity = Endereco.create(dto.endereco);
    const savedEndereco = await this.enderecoRepository.create(enderecoEntity);

    const protetor = ProtetorOng.create({
      usuarioId: usuario.id!,
      cnpjCpf: dto.cnpjCpf,
      nomeOrganizacao: dto.nomeOrganizacao ?? null,
      enderecoId: savedEndereco.id!,
      descricao: dto.descricao ?? null,
      imagemBase64: dto.imagemBase64 ?? null,
    });
    await this.protetorRepository.create(protetor);

    const response = ProtetorOngResponseDto.fromProtetorOng(protetor, {
      usuario: UsuarioResponseDto.fromUsuario(usuario),
      endereco: EnderecoResponseDto.fromEndereco(savedEndereco),
    })!;

    await this.messagingService.publishProtetorCreated(response);
    return response;
  }

  async listPaginated(params: PaginationParams): Promise<{ rows: ProtetorOngResponseDto[]; total: number }> {
    const result = await this.protetorRepository.findAllPaginated(params);
    return { rows: result.rows.map((p) => ProtetorOngResponseDto.fromProtetorOng(p)!), total: result.total };
  }

  async findById(id: string): Promise<ProtetorOngResponseDto> {
    const protetor = await this.protetorRepository.findById(id);
    if (!protetor) throw new NotFoundException('Protetor/ONG não encontrado');

    const [usuario, endereco] = await Promise.all([
      this.usuarioRepository.findById(protetor.usuarioId),
      this.enderecoRepository.findById(protetor.enderecoId),
    ]);

    return ProtetorOngResponseDto.fromProtetorOng(protetor, {
      usuario: UsuarioResponseDto.fromUsuario(usuario),
      endereco: EnderecoResponseDto.fromEndereco(endereco),
    })!;
  }

  async update(id: string, dto: UpdateProtetorOngDto): Promise<ProtetorOngResponseDto> {
    const protetor = await this.protetorRepository.findById(id);
    if (!protetor) throw new NotFoundException('Protetor/ONG não encontrado');

    if (dto.nomeOrganizacao !== undefined) protetor.withNomeOrganizacao(dto.nomeOrganizacao ?? null);
    if (dto.descricao !== undefined) protetor.withDescricao(dto.descricao ?? null);
    if (dto.imagemBase64 !== undefined) protetor.withImagemBase64(dto.imagemBase64 ?? null);

    if (dto.endereco) {
      const endereco = await this.enderecoRepository.findById(protetor.enderecoId);
      if (endereco) {
        endereco.withCep(dto.endereco.cep)
          .withLogradouro(dto.endereco.logradouro)
          .withNumero(dto.endereco.numero)
          .withComplemento(dto.endereco.complemento ?? null)
          .withBairro(dto.endereco.bairro)
          .withCidade(dto.endereco.cidade)
          .withEstado(dto.endereco.estado)
          .touch(new Date());
        await this.enderecoRepository.update(endereco);
      }
    }

    protetor.touch(new Date());
    await this.protetorRepository.update(protetor);

    const response = ProtetorOngResponseDto.fromProtetorOng(protetor)!;
    await this.messagingService.publishProtetorUpdated(response);
    return response;
  }
}

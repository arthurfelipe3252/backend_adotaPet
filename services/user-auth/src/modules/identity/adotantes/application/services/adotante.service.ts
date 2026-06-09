import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import {
  ADOTANTE_REPOSITORY,
  type AdotanteRepository,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
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
  AdotanteResponseDto,
  type CreateAdotanteDto,
  type UpdateAdotanteDto,
} from '../dto/adotante.dto';
import { AdotanteMessagingService } from './adotante-messaging.service';

@Injectable()
export class AdotanteService {
  constructor(
    @Inject(ADOTANTE_REPOSITORY)
    private readonly adotanteRepository: AdotanteRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: EnderecoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly messagingService: AdotanteMessagingService,
  ) {}

  async create(dto: CreateAdotanteDto): Promise<AdotanteResponseDto> {
    const emailExists = await this.usuarioRepository.findByEmail(dto.usuario.email);
    if (emailExists) throw new ConflictException('Email já cadastrado');

    const senhaHash = await this.passwordHasher.hash(dto.usuario.senha);
    const usuario = Usuario.create({
      nome: dto.usuario.nome,
      email: dto.usuario.email,
      senhaHash,
      telefone: dto.usuario.telefone ?? null,
      tipoUsuario: 'adotante',
    });
    await this.usuarioRepository.create(usuario);

    const enderecoEntity = Endereco.create(dto.endereco);
    const savedEndereco = await this.enderecoRepository.create(enderecoEntity);

    const adotante = Adotante.create({
      usuarioId: usuario.id!,
      cpf: dto.cpf,
      enderecoId: savedEndereco.id!,
      imagemBase64: dto.imagemBase64 ?? null,
    });
    await this.adotanteRepository.create(adotante);

    const response = AdotanteResponseDto.fromAdotante(adotante, {
      usuario: UsuarioResponseDto.fromUsuario(usuario),
      endereco: EnderecoResponseDto.fromEndereco(savedEndereco),
    })!;

    await this.messagingService.publishAdotanteCreated(response);
    return response;
  }

  async listPaginated(params: PaginationParams): Promise<{ rows: AdotanteResponseDto[]; total: number }> {
    const result = await this.adotanteRepository.findAllPaginated(params);
    return { rows: result.rows.map((a) => AdotanteResponseDto.fromAdotante(a)!), total: result.total };
  }

  async findById(id: string): Promise<AdotanteResponseDto> {
    const adotante = await this.adotanteRepository.findById(id);
    if (!adotante) throw new NotFoundException('Adotante não encontrado');

    const [usuario, endereco] = await Promise.all([
      this.usuarioRepository.findById(adotante.usuarioId),
      this.enderecoRepository.findById(adotante.enderecoId),
    ]);

    return AdotanteResponseDto.fromAdotante(adotante, {
      usuario: UsuarioResponseDto.fromUsuario(usuario),
      endereco: EnderecoResponseDto.fromEndereco(endereco),
    })!;
  }

  async update(id: string, dto: UpdateAdotanteDto): Promise<AdotanteResponseDto> {
    const adotante = await this.adotanteRepository.findById(id);
    if (!adotante) throw new NotFoundException('Adotante não encontrado');

    if (dto.imagemBase64 !== undefined) adotante.withImagemBase64(dto.imagemBase64 ?? null);

    if (dto.endereco) {
      const endereco = await this.enderecoRepository.findById(adotante.enderecoId);
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

    adotante.touch(new Date());
    await this.adotanteRepository.update(adotante);

    const response = AdotanteResponseDto.fromAdotante(adotante)!;
    await this.messagingService.publishAdotanteUpdated(response);
    return response;
  }
}

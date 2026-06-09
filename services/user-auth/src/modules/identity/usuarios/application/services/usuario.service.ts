import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PaginationParams } from '@shared/infra/hateoas';
import type { AuthenticatedUser } from '@shared/infra/decorators/current-user.decorator';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@identity/usuarios/domain/ports/password-hasher.interface';
import {
  UsuarioResponseDto,
  type CreateUsuarioDto,
  type UpdateUsuarioDto,
} from '../dto/usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async create(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    const exists = await this.usuarioRepository.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email já cadastrado');

    const senhaHash = await this.passwordHasher.hash(dto.senha);
    const usuario = Usuario.create({
      nome: dto.nome,
      email: dto.email,
      senhaHash,
      telefone: dto.telefone ?? null,
      tipoUsuario: dto.tipoUsuario,
    });

    await this.usuarioRepository.create(usuario);
    return UsuarioResponseDto.fromUsuario(usuario)!;
  }

  async listPaginated(params: PaginationParams): Promise<{ rows: UsuarioResponseDto[]; total: number }> {
    const result = await this.usuarioRepository.findAllPaginated(params);
    return { rows: result.rows.map((u) => UsuarioResponseDto.fromUsuario(u)!), total: result.total };
  }

  async findById(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return UsuarioResponseDto.fromUsuario(usuario)!;
  }

  async update(
    id: string,
    dto: UpdateUsuarioDto,
    currentUser: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    if (currentUser.tipoUsuario !== 'admin' && currentUser.id !== id) {
      throw new ForbiddenException('Sem permissão para editar este usuário');
    }

    if (dto.nome !== undefined) usuario.withNome(dto.nome);
    if (dto.email !== undefined) usuario.withEmail(dto.email);
    if (dto.telefone !== undefined) usuario.withTelefone(dto.telefone ?? null);
    if (dto.senha !== undefined) {
      const senhaHash = await this.passwordHasher.hash(dto.senha);
      usuario.withSenhaHash(senhaHash);
    }
    usuario.touch(new Date());

    await this.usuarioRepository.update(usuario);
    return UsuarioResponseDto.fromUsuario(usuario)!;
  }

  async deactivate(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    if (currentUser.tipoUsuario !== 'admin' && currentUser.id !== id) {
      throw new ForbiddenException('Sem permissão');
    }

    await this.usuarioRepository.deactivate(id);
  }
}

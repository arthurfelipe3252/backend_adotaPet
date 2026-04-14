import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  type CreateUserDto,
  type UpdateUserDto,
  type UserDto,
} from "@identity/users/application/dto/user.dto";
import { User } from "@identity/users/domain/models/user.entity";
import {
  USER_REPOSITORY,
  type UserRepository,
} from "@identity/users/domain/repositories/user-repository.interface";

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async create(payload: CreateUserDto): Promise<UserDto> {
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const cpfcnpj = this.normalizeCpfCnpj(payload.cpfcnpj);

    if (!name || !email || !cpfcnpj) {
      throw new BadRequestException("name, email e cpfcnpj sao obrigatorios");
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException("email ja cadastrado");
    }

    const documentOwner = await this.userRepository.findByCpfcnpj(cpfcnpj);
    if (documentOwner) {
      throw new ConflictException("cpfcnpj ja cadastrado");
    }

    const created = await this.userRepository.create(
      User.restore({
        name,
        email,
        cpfcnpj,
      })!,
    );

    return this.toDto(created);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.toDto(user));
  }

  async findById(id: string): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("usuario nao encontrado");
    }

    return this.toDto(user);
  }

  async update(id: string, payload: UpdateUserDto): Promise<UserDto> {
    const current = await this.userRepository.findById(id);
    if (!current) {
      throw new NotFoundException("usuario nao encontrado");
    }

    const nextName = payload.name?.trim() ?? current.name;
    const nextEmail = payload.email?.trim().toLowerCase() ?? current.email;
    const nextCpfcnpj = payload.cpfcnpj
      ? this.normalizeCpfCnpj(payload.cpfcnpj)
      : current.cpfcnpj;

    if (!nextName || !nextEmail || !nextCpfcnpj) {
      throw new BadRequestException("name, email e cpfcnpj nao podem ficar vazios");
    }

    if (!payload.name && !payload.email && !payload.cpfcnpj) {
      throw new BadRequestException("informe ao menos um campo para atualizar");
    }

    if (nextEmail !== current.email) {
      const emailOwner = await this.userRepository.findByEmail(nextEmail);
      if (emailOwner && emailOwner.id !== id) {
        throw new ConflictException("email ja cadastrado");
      }
    }

    if (nextCpfcnpj !== current.cpfcnpj) {
      const documentOwner = await this.userRepository.findByCpfcnpj(nextCpfcnpj);
      if (documentOwner && documentOwner.id !== id) {
        throw new ConflictException("cpfcnpj ja cadastrado");
      }
    }

    const updated = await this.userRepository.update(
      id,
      User.restore({
        id: current.id,
        name: nextName,
        email: nextEmail,
        cpfcnpj: nextCpfcnpj,
        createdAt: current.createdAt,
        updatedAt: current.updatedAt,
      })!,
    );

    if (!updated) {
      throw new NotFoundException("usuario nao encontrado");
    }

    return this.toDto(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("usuario nao encontrado");
    }

    await this.userRepository.delete(id);
  }

  private toDto(user: User): UserDto {
    return {
      id: user.id!,
      name: user.name,
      email: user.email,
      cpfcnpj: user.cpfcnpj,
      createdAt: user.createdAt!,
      updatedAt: user.updatedAt!,
    };
  }

  private normalizeCpfCnpj(value: string): string {
    return value.replace(/\D/g, "");
  }
}
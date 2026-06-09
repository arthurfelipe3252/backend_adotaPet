import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TipoUsuario, Usuario } from '@identity/usuarios/domain/models/usuario.entity';

export class CreateUsuarioDto {
  @ApiProperty() @IsString() nome!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(6) senha!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiProperty() @IsEnum(['adotante', 'protetor_ong', 'admin']) tipoUsuario!: TipoUsuario;
}

export class UpdateUsuarioDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nome?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(6) senha?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string | null;
}

export class UsuarioResponseDto {
  id!: string;
  nome!: string;
  email!: string;
  telefone?: string | null;
  tipoUsuario!: TipoUsuario;
  ativo!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromUsuario(usuario: Usuario | null): UsuarioResponseDto | null {
    if (!usuario) return null;
    const dto = new UsuarioResponseDto();
    dto.id = usuario.id!;
    dto.nome = usuario.nome;
    dto.email = usuario.email;
    dto.telefone = usuario.telefone;
    dto.tipoUsuario = usuario.tipoUsuario;
    dto.ativo = usuario.ativo;
    dto.createdAt = usuario.createdAt!;
    dto.updatedAt = usuario.updatedAt!;
    return dto;
  }
}

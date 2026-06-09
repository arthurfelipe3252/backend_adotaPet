import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { EnderecoDto, EnderecoResponseDto } from '@identity/enderecos/application/dto/endereco.dto';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario.dto';
import type { Adotante } from '@identity/adotantes/domain/models/adotante.entity';

export class CreateAdotanteUsuarioDto {
  @ApiProperty() @IsString() nome!: string;
  @ApiProperty() @IsString() email!: string;
  @ApiProperty() @IsString() senha!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
}

export class CreateAdotanteDto {
  @ApiProperty({ description: 'CPF no formato 000.000.000-00 ou 00000000000' })
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)
  cpf!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() imagemBase64?: string;

  @ApiProperty({ type: EnderecoDto })
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco!: EnderecoDto;

  @ApiProperty({ description: 'Dados do usuário a ser criado' })
  @ValidateNested()
  @Type(() => CreateAdotanteUsuarioDto)
  usuario!: CreateAdotanteUsuarioDto;
}

export class UpdateAdotanteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() imagemBase64?: string | null;
  @ApiPropertyOptional() @IsOptional() @Type(() => EnderecoDto) @ValidateNested() endereco?: EnderecoDto;
}

export class AdotanteResponseDto {
  id!: string;
  usuarioId!: string;
  cpf!: string;
  enderecoId!: string;
  imagemBase64?: string | null;
  usuario?: UsuarioResponseDto | null;
  endereco?: EnderecoResponseDto | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromAdotante(
    adotante: Adotante | null,
    opts?: { usuario?: UsuarioResponseDto | null; endereco?: EnderecoResponseDto | null },
  ): AdotanteResponseDto | null {
    if (!adotante) return null;
    const dto = new AdotanteResponseDto();
    dto.id = adotante.id!;
    dto.usuarioId = adotante.usuarioId;
    dto.cpf = adotante.cpf;
    dto.enderecoId = adotante.enderecoId;
    dto.imagemBase64 = adotante.imagemBase64 ?? null;
    dto.usuario = opts?.usuario;
    dto.endereco = opts?.endereco;
    dto.createdAt = adotante.createdAt!;
    dto.updatedAt = adotante.updatedAt!;
    return dto;
  }
}

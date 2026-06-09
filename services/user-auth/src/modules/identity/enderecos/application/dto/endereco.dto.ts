import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Endereco } from '@identity/enderecos/domain/models/endereco.entity';

export class EnderecoDto {
  @ApiProperty() @IsString() @Length(8, 10) cep!: string;
  @ApiProperty() @IsString() logradouro!: string;
  @ApiProperty() @IsString() numero!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() complemento?: string;
  @ApiProperty() @IsString() bairro!: string;
  @ApiProperty() @IsString() cidade!: string;
  @ApiProperty() @IsString() @Length(2, 2) estado!: string;
}

export class EnderecoResponseDto {
  id!: string;
  cep!: string;
  logradouro!: string;
  numero!: string;
  complemento?: string | null;
  bairro!: string;
  cidade!: string;
  estado!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEndereco(endereco: Endereco | null): EnderecoResponseDto | null {
    if (!endereco) return null;
    const dto = new EnderecoResponseDto();
    dto.id = endereco.id!;
    dto.cep = endereco.cep;
    dto.logradouro = endereco.logradouro;
    dto.numero = endereco.numero;
    dto.complemento = endereco.complemento ?? null;
    dto.bairro = endereco.bairro;
    dto.cidade = endereco.cidade;
    dto.estado = endereco.estado;
    dto.createdAt = endereco.createdAt!;
    dto.updatedAt = endereco.updatedAt!;
    return dto;
  }
}

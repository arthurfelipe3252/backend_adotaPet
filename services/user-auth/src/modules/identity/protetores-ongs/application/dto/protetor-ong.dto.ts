import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { EnderecoDto, EnderecoResponseDto } from '@identity/enderecos/application/dto/endereco.dto';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario.dto';
import type { ProtetorOng } from '@identity/protetores-ongs/domain/models/protetor-ong.entity';

export class CreateProtetorOngUsuarioDto {
  @ApiProperty() @IsString() nome!: string;
  @ApiProperty() @IsString() email!: string;
  @ApiProperty() @IsString() senha!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
}

export class CreateProtetorOngDto {
  @ApiProperty() @IsString() cnpjCpf!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nomeOrganizacao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imagemBase64?: string;

  @ApiProperty({ type: EnderecoDto })
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco!: EnderecoDto;

  @ApiProperty({ type: CreateProtetorOngUsuarioDto })
  @ValidateNested()
  @Type(() => CreateProtetorOngUsuarioDto)
  usuario!: CreateProtetorOngUsuarioDto;
}

export class UpdateProtetorOngDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nomeOrganizacao?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() imagemBase64?: string | null;
  @ApiPropertyOptional() @IsOptional() @Type(() => EnderecoDto) @ValidateNested() endereco?: EnderecoDto;
}

export class ProtetorOngResponseDto {
  id!: string;
  usuarioId!: string;
  cnpjCpf!: string;
  nomeOrganizacao?: string | null;
  enderecoId!: string;
  descricao?: string | null;
  imagemBase64?: string | null;
  usuario?: UsuarioResponseDto | null;
  endereco?: EnderecoResponseDto | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromProtetorOng(
    protetor: ProtetorOng | null,
    opts?: { usuario?: UsuarioResponseDto | null; endereco?: EnderecoResponseDto | null },
  ): ProtetorOngResponseDto | null {
    if (!protetor) return null;
    const dto = new ProtetorOngResponseDto();
    dto.id = protetor.id!;
    dto.usuarioId = protetor.usuarioId;
    dto.cnpjCpf = protetor.cnpjCpf;
    dto.nomeOrganizacao = protetor.nomeOrganizacao ?? null;
    dto.enderecoId = protetor.enderecoId;
    dto.descricao = protetor.descricao ?? null;
    dto.imagemBase64 = protetor.imagemBase64 ?? null;
    dto.usuario = opts?.usuario;
    dto.endereco = opts?.endereco;
    dto.createdAt = protetor.createdAt!;
    dto.updatedAt = protetor.updatedAt!;
    return dto;
  }
}

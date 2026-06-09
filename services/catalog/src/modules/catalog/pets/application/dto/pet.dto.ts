import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Especie, Porte, PetStatus, Sexo, Pet } from '@catalog/pets/domain/models/pet.entity';

export class CreatePetDto {
  @ApiProperty() @IsUUID() protetorId!: string;
  @ApiProperty() @IsString() nome!: string;
  @ApiProperty() @IsEnum(['cao', 'gato', 'outro']) especie!: Especie;
  @ApiPropertyOptional() @IsOptional() @IsString() raca?: string;
  @ApiProperty() @IsEnum(['pequeno', 'medio', 'grande']) porte!: Porte;
  @ApiProperty() @IsEnum(['macho', 'femea']) sexo!: Sexo;
  @ApiProperty() @IsInt() @Min(0) idadeMeses!: number;
  @ApiProperty() @IsBoolean() castrado!: boolean;
  @ApiProperty() @IsBoolean() vacinado!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() temperamento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString({ each: true }) fotosUrls?: string[];
}

export class UpdatePetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nome?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['cao', 'gato', 'outro']) especie?: Especie;
  @ApiPropertyOptional() @IsOptional() @IsString() raca?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['pequeno', 'medio', 'grande']) porte?: Porte;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['macho', 'femea']) sexo?: Sexo;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) idadeMeses?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() castrado?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() vacinado?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() temperamento?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['disponivel', 'em_processo', 'adotado']) status?: PetStatus;
  @ApiPropertyOptional() @IsOptional() @IsString({ each: true }) fotosUrls?: string[] | null;
}

export class PetResponseDto {
  id!: string;
  protetorId!: string;
  nome!: string;
  especie!: Especie;
  raca!: string | null;
  porte!: Porte;
  sexo!: Sexo;
  idadeMeses!: number;
  castrado!: boolean;
  vacinado!: boolean;
  descricao!: string | null;
  temperamento!: string | null;
  status!: PetStatus;
  fotosUrls!: string[];
  createdAt!: Date;
  updatedAt!: Date;

  static fromPet(pet: Pet | null): PetResponseDto | null {
    if (!pet) return null;
    const dto = new PetResponseDto();
    dto.id = pet.id!;
    dto.protetorId = pet.protetorId;
    dto.nome = pet.nome;
    dto.especie = pet.especie;
    dto.raca = pet.raca ?? null;
    dto.porte = pet.porte;
    dto.sexo = pet.sexo;
    dto.idadeMeses = pet.idadeMeses;
    dto.castrado = pet.castrado;
    dto.vacinado = pet.vacinado;
    dto.descricao = pet.descricao ?? null;
    dto.temperamento = pet.temperamento ?? null;
    dto.status = pet.status;
    dto.fotosUrls = pet.fotosUrls ?? [];
    dto.createdAt = pet.createdAt!;
    dto.updatedAt = pet.updatedAt!;
    return dto;
  }
}

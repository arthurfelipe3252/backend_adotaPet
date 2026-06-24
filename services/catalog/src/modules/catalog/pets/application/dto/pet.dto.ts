import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  Especie,
  Porte,
  Sexo,
  PetStatus,
} from '../../domain/models/pet.entity';

const ESPECIES = ['cao', 'gato', 'outro'] as const;
const PORTES = ['pequeno', 'medio', 'grande'] as const;
const SEXOS = ['macho', 'femea'] as const;
const STATUSES = ['disponivel', 'em_processo', 'adotado'] as const;

/**
 * Body do POST /pets. O `protetorId` NÃO está aqui de propósito: é
 * resolvido a partir do JWT no service. Aceitar do cliente permitiria
 * que um protetor criasse pet em nome de outro.
 *
 * É uma `class` (não interface) pra que o ValidationPipe global valide o
 * body — input inválido vira 400, não 500.
 */
export class CreatePetDto {
  @ApiProperty({ example: 'Rex', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;

  @ApiProperty({ enum: ESPECIES })
  @IsEnum(ESPECIES)
  especie!: Especie;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  raca?: string | null;

  @ApiProperty({ enum: PORTES })
  @IsEnum(PORTES)
  porte!: Porte;

  @ApiProperty({ enum: SEXOS })
  @IsEnum(SEXOS)
  sexo!: Sexo;

  @ApiProperty({ example: 24, minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(600)
  idadeMeses!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  castrado!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  vacinado!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  temperamento?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotosUrls?: string[] | null;
}

/**
 * Body do PATCH /pets/:id. Todos os campos são opcionais — só vai pro banco
 * o que for enviado. Classe standalone (não `PartialType`) pra seguir a
 * convenção dos demais update DTOs do projeto. Inclui `status`, que só faz
 * sentido no update (no create o pet sempre nasce `disponivel`).
 */
export class UpdatePetDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ enum: ESPECIES })
  @IsOptional()
  @IsEnum(ESPECIES)
  especie?: Especie;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  raca?: string | null;

  @ApiPropertyOptional({ enum: PORTES })
  @IsOptional()
  @IsEnum(PORTES)
  porte?: Porte;

  @ApiPropertyOptional({ enum: SEXOS })
  @IsOptional()
  @IsEnum(SEXOS)
  sexo?: Sexo;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  idadeMeses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  castrado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vacinado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  temperamento?: string | null;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsEnum(STATUSES)
  status?: PetStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotosUrls?: string[] | null;
}

export interface ProfileSummary {
  id: string;
  nome: string;
}

export interface PetResponseDto {
  id: string;
  protetorId: string;
  /**
   * Summary (id + nome) do protetor/ong dono — populado pelo service
   * via batch lookup. Nulo se o protetor foi excluído.
   */
  protetor: ProfileSummary | null;
  nome: string;
  especie: Especie;
  raca: string | null;
  porte: Porte;
  sexo: Sexo;
  idadeMeses: number;
  castrado: boolean;
  vacinado: boolean;
  descricao: string | null;
  temperamento: string | null;
  status: PetStatus;
  fotosUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * DTO de entrada para o objeto `endereco` aninhado nos cadastros de
 * adotante e protetor/ONG. Usado também como response (campos espelham 1:1).
 *
 * Validação rigorosa por tipo: cada decorator do class-validator garante
 * que o ValidationPipe global (whitelist + forbidNonWhitelisted) rejeita
 * campos extras ou tipos errados antes de chegar no service.
 */
export class EnderecoDto {
  @ApiProperty({ example: 'Rua das Flores', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  logradouro!: string;

  @ApiProperty({ example: '123', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  numero!: string;

  @ApiPropertyOptional({ example: 'Apto 42', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complemento?: string;

  @ApiProperty({ example: 'Centro', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  bairro!: string;

  @ApiProperty({ example: 'São Paulo', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  cidade!: string;

  @ApiProperty({ example: 'SP', minLength: 2, maxLength: 2 })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'estado deve ser sigla UF (2 letras maiúsculas, ex: SP)',
  })
  estado!: string;

  @ApiProperty({
    example: '01000000',
    description: 'CEP com 8 dígitos, sem máscara',
  })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'cep deve conter 8 dígitos sem máscara' })
  cep!: string;
}

/**
 * DTO de saída — espelha o de entrada e adiciona id/timestamps.
 */
export class EnderecoResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Rua das Flores' })
  logradouro!: string;

  @ApiProperty({ example: '123' })
  numero!: string;

  @ApiPropertyOptional({ example: 'Apto 42', nullable: true })
  complemento!: string | null;

  @ApiProperty({ example: 'Centro' })
  bairro!: string;

  @ApiProperty({ example: 'São Paulo' })
  cidade!: string;

  @ApiProperty({ example: 'SP' })
  estado!: string;

  @ApiProperty({ example: '01000000' })
  cep!: string;

  @ApiProperty({ example: '2026-04-09T15:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-09T15:30:00.000Z' })
  updatedAt!: Date;
}

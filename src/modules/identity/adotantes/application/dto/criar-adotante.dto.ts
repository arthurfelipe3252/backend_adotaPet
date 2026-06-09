import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsCPF } from '@shared/validators/is-cpf.decorator';
import { EnderecoDto } from '@identity/enderecos/application/dto/endereco.dto';

/**
 * Body de POST /users/adotantes.
 *
 * Cria, atomicamente: endereço (opcional) → usuário → adotante.
 * `tipoUsuario` é cravado pelo controller como 'adotante' — não vem do
 * cliente, evitando que se forje outro tipo.
 */
export class CriarAdotanteDto {
  @ApiProperty({ example: 'Ana Silva', minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome!: string;

  @ApiProperty({
    example: 'ana@email.com',
    maxLength: 150,
    description: 'Será normalizado para lowercase',
  })
  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    example: 'senhaSegura123',
    minLength: 8,
    maxLength: 72,
    description: 'Texto puro; será hasheada com bcrypt',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  senha!: string;

  @ApiPropertyOptional({
    example: '11987654321',
    description: 'Somente dígitos, 10 ou 11 caracteres',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'telefone deve conter apenas dígitos (10 ou 11 caracteres)',
  })
  telefone?: string;

  @ApiProperty({
    example: '39053344705',
    description:
      'CPF com 11 dígitos. Aceita com ou sem máscara — caracteres não numéricos são removidos antes da validação. Dígito verificador é checado.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsCPF()
  cpf!: string;

  @ApiPropertyOptional({
    description:
      'Foto de perfil em base64. Limite ~5 MB de arquivo binário ' +
      '(equivalente a ~7 MB de string base64).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(7_000_000, {
    message: 'imagemBase64 excede o tamanho permitido (~5 MB)',
  })
  imagemBase64?: string;

  @ApiProperty({
    type: EnderecoDto,
    description: 'Endereço residencial. Obrigatório no cadastro.',
  })
  @IsObject({ message: 'endereco deve ser um objeto' })
  @IsNotEmptyObject(undefined, { message: 'endereco é obrigatório' })
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco!: EnderecoDto;
}

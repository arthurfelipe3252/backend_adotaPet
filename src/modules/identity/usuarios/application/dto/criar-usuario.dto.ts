import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

/**
 * Body do POST /users (registro público).
 */
export class CriarUsuarioDto {
  @ApiProperty({
    description: 'Nome completo do usuário ou da organização',
    example: 'João Silva',
    minLength: 2,
    maxLength: 150,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome!: string;

  @ApiProperty({
    description: 'Email único do usuário (será normalizado para lowercase)',
    example: 'joao@email.com',
    maxLength: 150,
  })
  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    description:
      'Senha em texto puro. Será hasheada com bcrypt antes de salvar.',
    example: 'senhaSegura123',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // limite de bytes do bcrypt
  senha!: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário (somente dígitos, 10 ou 11 caracteres)',
    example: '11987654321',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'telefone deve conter apenas dígitos (10 ou 11 caracteres)',
  })
  telefone?: string;

  @ApiPropertyOptional({
    description:
      'Imagem de perfil codificada em base64. Futuramente será substituída por URL de serviço de armazenamento.',
    example: null,
  })
  @IsOptional()
  @IsString()
  @MaxLength(700_000, {
    message: 'imagemBase64 excede o tamanho máximo permitido (~500 KB)',
  })
  imagemBase64?: string;

  @ApiProperty({
    description: 'Tipo do usuário',
    enum: TipoUsuario,
    example: TipoUsuario.Adotante,
  })
  @IsEnum(TipoUsuario)
  tipoUsuario!: TipoUsuario;
}

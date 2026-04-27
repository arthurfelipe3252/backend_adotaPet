import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Body do PATCH /users/:id.
 *
 * Permite alterar apenas os campos não-identificadores do usuário-mãe
 * (nome e telefone). Endereço/foto/dados específicos da filha têm
 * endpoints próprios (PATCH /users/adotantes/me, PATCH /users/protetores-ongs/me).
 *
 * Imutáveis aqui:
 * - email:        identidade de login.
 * - senha:        use PATCH /users/me/password (exige senhaAtual).
 * - tipoUsuario:  imutável após o cadastro.
 * - imagemBase64: pertence à entidade filha (foto de perfil).
 */
export class AtualizarUsuarioDto {
  @ApiPropertyOptional({
    description: 'Nome completo do usuário ou da organização',
    example: 'João Silva',
    minLength: 2,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome?: string;

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
}

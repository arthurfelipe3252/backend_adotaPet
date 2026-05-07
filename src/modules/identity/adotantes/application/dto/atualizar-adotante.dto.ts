import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { EnderecoDto } from '@identity/enderecos/application/dto/endereco.dto';

/**
 * Body do PATCH /users/adotantes/me.
 *
 * Campos são todos opcionais — só vai pro banco o que for enviado.
 *
 * Imutáveis (NÃO entram aqui):
 * - cpf:         identidade do adotante.
 * - tipoUsuario: imutável após cadastro.
 * - email:       identidade de login; alterar exige fluxo dedicado.
 * - senha:       use PATCH /users/me/password (exige senhaAtual).
 *
 * Endereço:
 * - omitido         → não mexe.
 * - objeto completo → atualiza in-place o endereço atual.
 *
 * (Não aceita `null` nem vazio — o endereço é obrigatório no perfil.)
 */
export class AtualizarAdotanteDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Ana Silva',
    minLength: 2,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome?: string;

  @ApiPropertyOptional({
    type: String,
    example: '11987654321',
    description: 'Somente dígitos, 10 ou 11 caracteres',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'telefone deve conter apenas dígitos (10 ou 11 caracteres)',
  })
  telefone?: string;

  @ApiPropertyOptional({
    type: String,
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

  @ApiPropertyOptional({
    type: EnderecoDto,
    description:
      'Omita para não mexer no endereço atual; envie objeto completo ' +
      'para substituí-lo. Não aceita `null` (endereço é obrigatório).',
  })
  // @ValidateIf em vez de @IsOptional: queremos que o campo possa ser
  // *omitido* (undefined → pula validação) mas não *null* (null deve cair
  // em @IsObject e gerar 400). @IsOptional pularia ambos os casos.
  @ValidateIf((_, value) => value !== undefined)
  @IsObject({ message: 'endereco deve ser um objeto válido (não null)' })
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto;
}

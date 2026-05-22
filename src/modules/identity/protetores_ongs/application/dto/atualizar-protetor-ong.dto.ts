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
 * Body do PATCH /users/protetores-ongs/me.
 *
 * Campos são todos opcionais — só vai pro banco o que for enviado.
 *
 * Imutáveis (NÃO entram aqui):
 * - cpfCnpj:                 identidade do protetor/ONG.
 * - tipoUsuario:             imutável após cadastro (não muda PF↔PJ).
 * - email:                   identidade de login.
 * - senha:                   use PATCH /users/me/password.
 * - documentoComprobatorio:  comprovante usado para verificação;
 *                            uma vez submetido, não pode ser substituído
 *                            por outro fluxo automático.
 *
 * Endereço:
 * - omitido         → não mexe.
 * - objeto completo → substitui in-place.
 *
 * (Não aceita `null` nem vazio — o endereço é obrigatório no perfil.)
 */
export class AtualizarProtetorOngDto {
  @ApiPropertyOptional({
    type: String,
    example: 'ONG Patinhas Felizes',
    minLength: 2,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome?: string;

  @ApiPropertyOptional({ type: String, example: '11987654321' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'telefone deve conter apenas dígitos (10 ou 11 caracteres)',
  })
  telefone?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'ONG dedicada à adoção responsável',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;

  @ApiPropertyOptional({ type: String, example: '11999998888' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'telefoneContato deve conter apenas dígitos (10 ou 11 caracteres)',
  })
  telefoneContato?: string;

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
  // @ValidateIf em vez de @IsOptional: ver explicação no
  // AtualizarAdotanteDto — null deve gerar 400, não pular validação.
  @ValidateIf((_, value) => value !== undefined)
  @IsObject({ message: 'endereco deve ser um objeto válido (não null)' })
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto;
}

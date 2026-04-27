import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsCpfOrCnpj } from '@shared/validators/is-cpf-or-cnpj.decorator';
import { EnderecoDto } from '@identity/enderecos/application/dto/endereco.dto';

/**
 * Tipo discriminador entre protetor PF (CPF) e ONG (CNPJ). A mesma tabela
 * `protetores_ongs` armazena os dois — só muda a quantidade de dígitos do
 * cpf_cnpj e qual enum vai pra `usuarios.tipo_usuario`.
 */
export type TipoProtetorOng = 'protetor' | 'ong';

/**
 * Body do POST /users/protetores-ongs.
 *
 * Cria, atomicamente: endereço (opcional) → usuário → protetor/ong.
 * Validação de CPF/CNPJ é condicional ao `tipoUsuario` enviado.
 */
export class CriarProtetorOngDto {
  @ApiProperty({ example: 'ONG Patinhas Felizes', minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome!: string;

  @ApiProperty({ example: 'contato@patinhas.org', maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'senhaSegura123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  senha!: string;

  @ApiPropertyOptional({
    example: '11987654321',
    description: 'Telefone pessoal do responsável (10 ou 11 dígitos)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'telefone deve conter apenas dígitos (10 ou 11 caracteres)',
  })
  telefone?: string;

  @ApiProperty({
    enum: ['protetor', 'ong'],
    example: 'ong',
    description:
      'Discriminador entre protetor (PF, CPF de 11 dígitos) e ONG (PJ, CNPJ de 14 dígitos)',
  })
  @IsEnum(['protetor', 'ong'], {
    message: 'tipoUsuario deve ser "protetor" ou "ong"',
  })
  tipoUsuario!: TipoProtetorOng;

  @ApiProperty({
    example: '11444777000161',
    description:
      'CPF (11 dígitos) se tipoUsuario=protetor; CNPJ (14 dígitos) se tipoUsuario=ong. ' +
      'Aceita com ou sem máscara. Dígito verificador é validado.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @IsCpfOrCnpj('tipoUsuario')
  cpfCnpj!: string;

  @ApiPropertyOptional({
    example: 'ONG dedicada à adoção responsável de cães e gatos.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;

  @ApiPropertyOptional({
    example: '11999998888',
    description: 'Telefone público de contato da organização',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'telefoneContato deve conter apenas dígitos (10 ou 11 caracteres)',
  })
  telefoneContato?: string;

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
    description:
      'Documento comprobatório (PDF ou imagem) em base64 — comprova identidade/CNPJ. ' +
      'Limite ~5 MB de arquivo binário (~7 MB de string base64). ' +
      'Obrigatório para todo protetor/ONG.',
  })
  @IsString()
  @MinLength(1, { message: 'documentoComprobatorio é obrigatório' })
  @MaxLength(7_000_000, {
    message: 'documentoComprobatorio excede o tamanho permitido (~5 MB)',
  })
  documentoComprobatorio!: string;

  @ApiProperty({
    type: EnderecoDto,
    description: 'Endereço da organização ou do protetor. Obrigatório no cadastro.',
  })
  @IsObject({ message: 'endereco deve ser um objeto' })
  @IsNotEmptyObject(undefined, { message: 'endereco é obrigatório' })
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco!: EnderecoDto;
}

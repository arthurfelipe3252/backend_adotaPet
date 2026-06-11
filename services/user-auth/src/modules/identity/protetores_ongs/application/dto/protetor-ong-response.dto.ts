import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnderecoResponseDto } from '@identity/enderecos/application/dto/endereco.dto';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import { ProtetorOng } from '@identity/protetores_ongs/domain/models/protetor-ong.entity';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario-response.dto';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';

/**
 * Resposta do POST /users/protetores-ongs — agrega usuário, perfil de
 * protetor/ONG e endereço quando enviado. Nunca expõe senhaHash.
 */
export class ProtetorOngResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({
    description: 'CPF (11 dígitos) ou CNPJ (14 dígitos), sem máscara',
  })
  cpfCnpj!: string;

  @ApiPropertyOptional({ nullable: true })
  descricao!: string | null;

  @ApiPropertyOptional({ nullable: true })
  telefoneContato!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Foto de perfil em base64',
  })
  imagemBase64!: string | null;

  @ApiProperty({
    description: 'Documento comprobatório (PDF/imagem) em base64',
  })
  documentoComprobatorio!: string;

  @ApiPropertyOptional({ nullable: true })
  enderecoId!: string | null;

  @ApiProperty({ example: '2026-04-09T15:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-09T15:30:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: UsuarioResponseDto })
  usuario!: UsuarioResponseDto;

  @ApiPropertyOptional({ type: EnderecoResponseDto, nullable: true })
  endereco!: EnderecoResponseDto | null;

  static montar(args: {
    protetorOng: ProtetorOng;
    usuario: Usuario;
    endereco: Endereco | null;
  }): ProtetorOngResponseDto {
    const dto = new ProtetorOngResponseDto();
    dto.id = args.protetorOng.id!;
    dto.cpfCnpj = args.protetorOng.cpfCnpj;
    dto.descricao = args.protetorOng.descricao ?? null;
    dto.telefoneContato = args.protetorOng.telefoneContato ?? null;
    dto.imagemBase64 = args.protetorOng.imagemBase64 ?? null;
    dto.documentoComprobatorio = args.protetorOng.documentoComprobatorio;
    dto.enderecoId = args.protetorOng.enderecoId ?? null;
    dto.createdAt = args.protetorOng.createdAt!;
    dto.updatedAt = args.protetorOng.updatedAt!;
    dto.usuario = UsuarioResponseDto.deUsuario(args.usuario);
    dto.endereco = args.endereco
      ? ProtetorOngResponseDto.enderecoToDto(args.endereco)
      : null;
    return dto;
  }

  private static enderecoToDto(e: Endereco): EnderecoResponseDto {
    const dto = new EnderecoResponseDto();
    dto.id = e.id!;
    dto.logradouro = e.logradouro;
    dto.numero = e.numero;
    dto.complemento = e.complemento ?? null;
    dto.bairro = e.bairro;
    dto.cidade = e.cidade;
    dto.estado = e.estado;
    dto.cep = e.cep;
    dto.createdAt = e.createdAt!;
    dto.updatedAt = e.updatedAt!;
    return dto;
  }
}

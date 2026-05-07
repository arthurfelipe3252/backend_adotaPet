import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EnderecoResponseDto,
} from '@identity/enderecos/application/dto/endereco.dto';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario-response.dto';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';

/**
 * Resposta do POST /users/adotantes — agrega usuário, perfil de adotante
 * e endereço (quando enviado). Nunca expõe senhaHash.
 */
export class AdotanteResponseDto {
  @ApiProperty({
    description: 'Identificador do adotante (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({ description: 'CPF (11 dígitos, sem máscara)' })
  cpf!: string;

  @ApiPropertyOptional({ nullable: true })
  imagemBase64!: string | null;

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
    adotante: Adotante;
    usuario: Usuario;
    endereco: Endereco | null;
  }): AdotanteResponseDto {
    const dto = new AdotanteResponseDto();
    dto.id = args.adotante.id!;
    dto.cpf = args.adotante.cpf;
    dto.imagemBase64 = args.adotante.imagemBase64 ?? null;
    dto.enderecoId = args.adotante.enderecoId ?? null;
    dto.createdAt = args.adotante.createdAt!;
    dto.updatedAt = args.adotante.updatedAt!;
    dto.usuario = UsuarioResponseDto.deUsuario(args.usuario);
    dto.endereco = args.endereco
      ? AdotanteResponseDto.enderecoToDto(args.endereco)
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

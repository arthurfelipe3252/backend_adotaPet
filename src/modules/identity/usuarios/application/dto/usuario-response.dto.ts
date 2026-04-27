import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';

/**
 * DTO de saída para qualquer endpoint que retorna um usuário.
 * IMPORTANTE: nunca expõe `senhaHash`. Sempre use `deUsuario()` para construir.
 *
 * `imagemBase64` NÃO está aqui: a foto de perfil pertence ao DTO da entidade
 * filha (AdotanteResponseDto / ProtetorOngResponseDto).
 */
export class UsuarioResponseDto {
  @ApiProperty({
    description: 'Identificador único (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({ example: 'João Silva' })
  nome!: string;

  @ApiProperty({ example: 'joao@email.com' })
  email!: string;

  @ApiPropertyOptional({ example: '11987654321', nullable: true })
  telefone!: string | null;

  @ApiProperty({ enum: TipoUsuario, example: TipoUsuario.Adotante })
  tipoUsuario!: TipoUsuario;

  @ApiProperty({
    description:
      'Indica se a conta está ativa. Contas com ativo=false são soft-deleted.',
    example: true,
  })
  ativo!: boolean;

  @ApiProperty({ example: '2026-04-09T15:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-09T15:30:00.000Z' })
  updatedAt!: Date;

  /**
   * Mapeia uma entidade Usuario para o DTO de resposta, omitindo a senha.
   */
  static deUsuario(usuario: Usuario): UsuarioResponseDto {
    const dto = new UsuarioResponseDto();
    dto.id = usuario.id!;
    dto.nome = usuario.nome;
    dto.email = usuario.email;
    dto.telefone = usuario.telefone ?? null;
    dto.tipoUsuario = usuario.tipoUsuario;
    dto.ativo = usuario.ativo;
    dto.createdAt = usuario.createdAt!;
    dto.updatedAt = usuario.updatedAt!;
    return dto;
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario-response.dto';

/**
 * Resposta dos endpoints POST /users/auth/login e POST /users/auth/refresh.
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT de acesso. Use no header Authorization: Bearer <token>',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description:
      'Refresh token opaco. Guarde com segurança e envie em /users/auth/refresh para obter novo par.',
    example: 'kQz8x2yC5...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Tempo de validade do access token, em segundos',
    example: 86400,
  })
  expiresIn!: number;

  @ApiProperty({ type: UsuarioResponseDto })
  user!: UsuarioResponseDto;
}

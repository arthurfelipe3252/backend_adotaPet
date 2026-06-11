import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Body dos endpoints POST /auth/refresh e POST /auth/logout.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token obtido em /auth/login (string opaca, base64url)',
    example: 'kQz8x2yC5...long-string',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

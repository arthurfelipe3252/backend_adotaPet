import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Body do POST /users/auth/reset-password.
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperação recebido por e-mail',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: 'Nova senha',
    example: 'novaSenhaSegura456',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  novaSenha!: string;
}
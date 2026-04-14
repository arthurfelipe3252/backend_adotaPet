import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Body do POST /auth/login.
 *
 * Nota: a validação da senha é apenas IsString + IsNotEmpty (sem MinLength),
 * para não revelar requisitos de senha na resposta de validação. Se a senha
 * estiver errada, retornamos 401 com mensagem genérica "Credenciais inválidas".
 */
export class LoginDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  @IsNotEmpty()
  senha!: string;
}

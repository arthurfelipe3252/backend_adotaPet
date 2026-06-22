import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'senhasDiferentes', async: false })
class SenhasDiferentes implements ValidatorConstraintInterface {
  validate(senhaNova: string, args: ValidationArguments): boolean {
    const dto = args.object as { senhaAtual?: string };
    return senhaNova !== dto.senhaAtual;
  }

  defaultMessage(): string {
    return 'A nova senha deve ser diferente da senha atual';
  }
}

/**
 * Body do PATCH /users/me/password.
 * Exige a senha atual para confirmar a identidade do solicitante,
 * mesmo já estando autenticado via JWT (defesa em profundidade).
 */
export class AlterarSenhaDto {
  @ApiProperty({
    description: 'Senha atual do usuário (para confirmação)',
    example: 'senhaAntiga123',
  })
  @IsString()
  @IsNotEmpty()
  senhaAtual!: string;

  @ApiProperty({
    description: 'Nova senha',
    example: 'novaSenhaSegura456',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Validate(SenhasDiferentes)
  senhaNova!: string;
}

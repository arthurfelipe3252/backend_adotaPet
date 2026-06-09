import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cnpj } from 'cpf-cnpj-validator';

/**
 * Constraint do class-validator que valida o dígito verificador de um CNPJ.
 * Aceita apenas string contendo 14 dígitos numéricos. Recomenda-se aplicar
 * `@Transform(strip não-dígitos)` antes deste decorator para tolerar entradas
 * com máscara (ex: 11.222.333/0001-81).
 */
@ValidatorConstraint({ name: 'isCnpj', async: false })
class IsCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && cnpj.isValid(value);
  }

  defaultMessage(): string {
    return 'CNPJ inválido (14 dígitos com dígito verificador correto)';
  }
}

export function IsCNPJ(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsCnpjConstraint,
    });
  };
}

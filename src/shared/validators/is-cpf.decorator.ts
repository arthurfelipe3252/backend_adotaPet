import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cpf } from 'cpf-cnpj-validator';

/**
 * Constraint do class-validator que valida o dígito verificador de um CPF.
 * Aceita apenas string contendo 11 dígitos numéricos. Recomenda-se aplicar
 * `@Transform(strip não-dígitos)` antes deste decorator para tolerar entradas
 * com máscara (ex: 123.456.789-09).
 */
@ValidatorConstraint({ name: 'isCpf', async: false })
class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && cpf.isValid(value);
  }

  defaultMessage(): string {
    return 'CPF inválido (11 dígitos com dígito verificador correto)';
  }
}

/**
 * Decorator @IsCPF() — usa o algoritmo de dígito verificador da lib
 * cpf-cnpj-validator. Rejeita sequências repetidas (00000000000) e
 * combinações com DV errado.
 */
export function IsCPF(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsCpfConstraint,
    });
  };
}

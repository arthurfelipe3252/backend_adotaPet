import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cnpj, cpf } from 'cpf-cnpj-validator';

/**
 * Valida um campo `cpfCnpj` aplicando o algoritmo correto conforme o
 * valor de outra propriedade do mesmo objeto (default: `tipoUsuario`):
 * - 'protetor' → @IsCPF
 * - 'ong'      → @IsCNPJ
 *
 * Existe porque encadear `@ValidateIf + @IsCPF` e `@ValidateIf + @IsCNPJ`
 * no mesmo campo NÃO funciona — `@ValidateIf` é por-propriedade e o
 * último decorator sobrescreve o anterior, criando bug onde uma das
 * regras é silenciosamente ignorada.
 */
@ValidatorConstraint({ name: 'isCpfOrCnpj', async: false })
class IsCpfOrCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    const tipoField = (args.constraints[0] as string) ?? 'tipoUsuario';
    const tipo = (args.object as Record<string, unknown>)[tipoField];

    if (tipo === 'protetor') return cpf.isValid(value);
    if (tipo === 'ong') return cnpj.isValid(value);

    // Tipo não suportado — class-validator do enum/enum-decorator já cobre
    // esse erro em outra propriedade. Aqui falhamos para não dar pass-through.
    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    const tipoField = (args.constraints[0] as string) ?? 'tipoUsuario';
    const tipo = (args.object as Record<string, unknown>)[tipoField];
    if (tipo === 'protetor')
      return 'protetor exige CPF válido (11 dígitos com dígito verificador correto)';
    if (tipo === 'ong')
      return 'ong exige CNPJ válido (14 dígitos com dígito verificador correto)';
    return 'tipoUsuario inválido para validar cpfCnpj';
  }
}

/**
 * Decorator @IsCpfOrCnpj('tipoUsuario'?) — escolhe entre validação de CPF
 * e CNPJ olhando outro campo do mesmo objeto.
 */
export function IsCpfOrCnpj(
  tipoFieldName = 'tipoUsuario',
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [tipoFieldName],
      validator: IsCpfOrCnpjConstraint,
    });
  };
}

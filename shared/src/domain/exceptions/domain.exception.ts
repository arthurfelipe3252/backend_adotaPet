/**
 * Exception base que entidades e value objects do domínio devem lançar
 * quando uma invariante de negócio é violada.
 *
 * Não depende de NestJS. Vive em shared/domain/ porque qualquer bounded
 * context pode usar a mesma base — todos compartilham a mesma noção de
 * "regra de domínio violada".
 *
 * Mapeada pra HTTP 400 BadRequest pelo DomainExceptionFilter no shared/infra.
 *
 * Subclasses específicas podem ser criadas por bounded context quando
 * quisermos um nome mais semântico (ex: EmailInvalidoException), mas não
 * é obrigatório — lançar a base com mensagem descritiva é suficiente.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';

    // Necessário pra preservar a cadeia de protótipos quando estendemos
    // Error nativo no TypeScript com target ES5/ES2015. ES2017+ não precisa,
    // mas é seguro deixar.
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}

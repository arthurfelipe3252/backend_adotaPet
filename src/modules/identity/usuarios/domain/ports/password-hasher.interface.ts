/**
 * Token de injeção de dependência. Usar com @Inject(PASSWORD_HASHER).
 */
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * Contrato do hasher de senhas. Mantém o domínio independente da biblioteca
 * de hash escolhida (bcrypt, argon2, etc). Implementação concreta em
 * users/infra/security/bcrypt-password-hasher.ts.
 */
export interface PasswordHasher {
  /**
   * Gera um hash a partir de uma senha em texto puro.
   */
  hash(plain: string): Promise<string>;

  /**
   * Compara senha em texto puro contra um hash existente.
   */
  compare(plain: string, hash: string): Promise<boolean>;
}

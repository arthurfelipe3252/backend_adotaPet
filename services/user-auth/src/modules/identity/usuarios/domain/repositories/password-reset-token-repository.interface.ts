import { PasswordResetToken } from '@identity/usuarios/domain/models/password-reset-token.entity';

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY',
);

/**
 * Contrato do repositório de tokens de recuperação de senha.
 */
export interface PasswordResetTokenRepository {
  /**
   * Insere um novo token e retorna a entidade com id gerado.
   */
  create(token: PasswordResetToken): Promise<PasswordResetToken>;

  /**
   * Busca pelo hash SHA-256 do token (que é o que está armazenado no banco).
   */
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;

  /**
   * Marca um token como usado (used_at = now).
   */
  markAsUsed(id: string): Promise<void>;

  /**
   * Invalida (marca como usado) todos os tokens ainda válidos de um usuário.
   * Chamado ao emitir um novo token de recuperação, para que links antigos
   * de e-mails anteriores parem de funcionar.
   */
  invalidateAllForUser(usuarioId: string): Promise<void>;
}
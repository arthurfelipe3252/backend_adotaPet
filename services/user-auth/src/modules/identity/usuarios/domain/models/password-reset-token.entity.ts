export interface PasswordResetTokenRestoreProps {
  id: string;
  usuarioId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface PasswordResetTokenCreateProps {
  usuarioId: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Entidade rica do token de recuperação de senha.
 * Não armazena o token em texto puro — apenas o hash SHA-256 dele
 * (mesmo padrão de RefreshToken).
 */
export class PasswordResetToken {
  private readonly _id?: string;
  private _usuarioId!: string;
  private _tokenHash!: string;
  private _expiresAt!: Date;
  private _usedAt?: Date;
  private readonly _createdAt?: Date;

  private constructor(id?: string, createdAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
  }

  // -------------------- getters --------------------

  get id(): string | undefined {
    return this._id;
  }

  get usuarioId(): string {
    return this._usuarioId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get usedAt(): Date | undefined {
    return this._usedAt;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  // -------------------- regras de domínio --------------------

  /**
   * Token é válido se ainda não foi usado e não expirou.
   */
  isValid(now: Date = new Date()): boolean {
    if (this._usedAt) return false;
    return this._expiresAt.getTime() > now.getTime();
  }

  markAsUsed(): this {
    this._usedAt = new Date();
    return this;
  }

  // -------------------- factories --------------------

  static restore(
    props?: PasswordResetTokenRestoreProps | null,
  ): PasswordResetToken | null {
    if (!props) return null;
    const entity = new PasswordResetToken(props.id, props.createdAt);
    entity._usuarioId = props.usuarioId;
    entity._tokenHash = props.tokenHash;
    entity._expiresAt = props.expiresAt;
    entity._usedAt = props.usedAt ?? undefined;
    return entity;
  }

  static create(props: PasswordResetTokenCreateProps): PasswordResetToken {
    const entity = new PasswordResetToken();
    entity._usuarioId = props.usuarioId;
    entity._tokenHash = props.tokenHash;
    entity._expiresAt = props.expiresAt;
    return entity;
  }
}
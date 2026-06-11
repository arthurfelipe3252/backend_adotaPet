export interface RefreshTokenRestoreProps {
  id: string;
  usuarioId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface RefreshTokenCreateProps {
  usuarioId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Entidade rica do refresh token.
 * Não armazena o token em texto puro — apenas o hash SHA-256 dele.
 */
export class RefreshToken {
  private readonly _id?: string;
  private _usuarioId!: string;
  private _tokenHash!: string;
  private _expiresAt!: Date;
  private _revokedAt?: Date;
  private _userAgent?: string;
  private _ipAddress?: string;
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

  get revokedAt(): Date | undefined {
    return this._revokedAt;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  // -------------------- regras de domínio --------------------

  /**
   * Token é válido se ainda não foi revogado e não expirou.
   */
  isValid(now: Date = new Date()): boolean {
    if (this._revokedAt) return false;
    return this._expiresAt.getTime() > now.getTime();
  }

  revoke(): this {
    this._revokedAt = new Date();
    return this;
  }

  // -------------------- factories --------------------

  static restore(props?: RefreshTokenRestoreProps | null): RefreshToken | null {
    if (!props) return null;
    const entity = new RefreshToken(props.id, props.createdAt);
    entity._usuarioId = props.usuarioId;
    entity._tokenHash = props.tokenHash;
    entity._expiresAt = props.expiresAt;
    entity._revokedAt = props.revokedAt ?? undefined;
    entity._userAgent = props.userAgent ?? undefined;
    entity._ipAddress = props.ipAddress ?? undefined;
    return entity;
  }

  static create(props: RefreshTokenCreateProps): RefreshToken {
    const entity = new RefreshToken();
    entity._usuarioId = props.usuarioId;
    entity._tokenHash = props.tokenHash;
    entity._expiresAt = props.expiresAt;
    entity._userAgent = props.userAgent;
    entity._ipAddress = props.ipAddress;
    return entity;
  }
}

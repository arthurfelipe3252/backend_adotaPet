export interface RefreshTokenProps {
  id?: string;
  usuarioId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
}

export class RefreshToken {
  private readonly _id?: string;
  private _usuarioId: string;
  private _tokenHash: string;
  private _expiresAt: Date;
  private _revokedAt?: Date | null;
  private readonly _createdAt?: Date;

  private constructor(id?: string, createdAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
  }

  get id(): string | undefined { return this._id; }
  get usuarioId(): string { return this._usuarioId; }
  get tokenHash(): string { return this._tokenHash; }
  get expiresAt(): Date { return this._expiresAt; }
  get revokedAt(): Date | null | undefined { return this._revokedAt; }
  get createdAt(): Date | undefined { return this._createdAt; }

  get isValid(): boolean {
    return !this._revokedAt && this._expiresAt > new Date();
  }

  revoke(): this {
    this._revokedAt = new Date();
    return this;
  }

  static restore(props?: RefreshTokenProps | null): RefreshToken | null {
    if (!props) return null;
    const entity = new RefreshToken(props.id, props.createdAt);
    entity._usuarioId = props.usuarioId;
    entity._tokenHash = props.tokenHash;
    entity._expiresAt = props.expiresAt;
    entity._revokedAt = props.revokedAt;
    return entity;
  }

  static create(props: Omit<RefreshTokenProps, 'id' | 'createdAt'>): RefreshToken {
    return RefreshToken.restore({ ...props, id: crypto.randomUUID(), createdAt: new Date() })!;
  }
}

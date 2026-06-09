export type TipoUsuario = 'adotante' | 'protetor_ong' | 'admin';

export interface UsuarioProps {
  id?: string;
  nome: string;
  email: string;
  senhaHash: string;
  telefone?: string | null;
  tipoUsuario: TipoUsuario;
  ativo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Usuario {
  private readonly _id?: string;
  private _nome: string;
  private _email: string;
  private _senhaHash: string;
  private _telefone?: string | null;
  private _tipoUsuario: TipoUsuario;
  private _ativo: boolean;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined { return this._id; }
  get nome(): string { return this._nome; }
  get email(): string { return this._email; }
  get senhaHash(): string { return this._senhaHash; }
  get telefone(): string | null | undefined { return this._telefone; }
  get tipoUsuario(): TipoUsuario { return this._tipoUsuario; }
  get ativo(): boolean { return this._ativo; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  withNome(nome: string): this { this._nome = nome; return this; }
  withEmail(email: string): this { this._email = email; return this; }
  withSenhaHash(senhaHash: string): this { this._senhaHash = senhaHash; return this; }
  withTelefone(telefone: string | null): this { this._telefone = telefone; return this; }
  withAtivo(ativo: boolean): this { this._ativo = ativo; return this; }
  touch(updatedAt: Date): this { this._updatedAt = updatedAt; return this; }

  static restore(props?: UsuarioProps | null): Usuario | null {
    if (!props) return null;
    const entity = new Usuario(props.id, props.createdAt, props.updatedAt);
    entity._nome = props.nome;
    entity._email = props.email;
    entity._senhaHash = props.senhaHash;
    entity._telefone = props.telefone;
    entity._tipoUsuario = props.tipoUsuario;
    entity._ativo = props.ativo ?? true;
    return entity;
  }

  static create(props: Omit<UsuarioProps, 'id' | 'createdAt' | 'updatedAt' | 'ativo'>): Usuario {
    const now = new Date();
    return Usuario.restore({ ...props, id: crypto.randomUUID(), ativo: true, createdAt: now, updatedAt: now })!;
  }
}

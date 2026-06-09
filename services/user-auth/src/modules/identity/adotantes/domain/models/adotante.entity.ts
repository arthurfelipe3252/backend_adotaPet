export interface AdotanteProps {
  id?: string;
  usuarioId: string;
  cpf: string;
  enderecoId: string;
  imagemBase64?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Adotante {
  private readonly _id?: string;
  private _usuarioId: string;
  private _cpf: string;
  private _enderecoId: string;
  private _imagemBase64?: string | null;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined { return this._id; }
  get usuarioId(): string { return this._usuarioId; }
  get cpf(): string { return this._cpf; }
  get enderecoId(): string { return this._enderecoId; }
  get imagemBase64(): string | null | undefined { return this._imagemBase64; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  withCpf(cpf: string): this { this._cpf = cpf; return this; }
  withEnderecoId(enderecoId: string): this { this._enderecoId = enderecoId; return this; }
  withImagemBase64(imagemBase64: string | null): this { this._imagemBase64 = imagemBase64; return this; }
  touch(updatedAt: Date): this { this._updatedAt = updatedAt; return this; }

  static restore(props?: AdotanteProps | null): Adotante | null {
    if (!props) return null;
    const entity = new Adotante(props.id, props.createdAt, props.updatedAt);
    entity._usuarioId = props.usuarioId;
    entity._cpf = props.cpf;
    entity._enderecoId = props.enderecoId;
    entity._imagemBase64 = props.imagemBase64;
    return entity;
  }

  static create(props: Omit<AdotanteProps, 'id' | 'createdAt' | 'updatedAt'>): Adotante {
    const now = new Date();
    return Adotante.restore({ ...props, id: crypto.randomUUID(), createdAt: now, updatedAt: now })!;
  }
}

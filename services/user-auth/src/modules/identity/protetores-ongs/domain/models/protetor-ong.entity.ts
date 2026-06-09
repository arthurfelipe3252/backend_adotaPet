export interface ProtetorOngProps {
  id?: string;
  usuarioId: string;
  cnpjCpf: string;
  nomeOrganizacao?: string | null;
  enderecoId: string;
  descricao?: string | null;
  imagemBase64?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProtetorOng {
  private readonly _id?: string;
  private _usuarioId: string;
  private _cnpjCpf: string;
  private _nomeOrganizacao?: string | null;
  private _enderecoId: string;
  private _descricao?: string | null;
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
  get cnpjCpf(): string { return this._cnpjCpf; }
  get nomeOrganizacao(): string | null | undefined { return this._nomeOrganizacao; }
  get enderecoId(): string { return this._enderecoId; }
  get descricao(): string | null | undefined { return this._descricao; }
  get imagemBase64(): string | null | undefined { return this._imagemBase64; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  withNomeOrganizacao(nomeOrganizacao: string | null): this { this._nomeOrganizacao = nomeOrganizacao; return this; }
  withEnderecoId(enderecoId: string): this { this._enderecoId = enderecoId; return this; }
  withDescricao(descricao: string | null): this { this._descricao = descricao; return this; }
  withImagemBase64(imagemBase64: string | null): this { this._imagemBase64 = imagemBase64; return this; }
  touch(updatedAt: Date): this { this._updatedAt = updatedAt; return this; }

  static restore(props?: ProtetorOngProps | null): ProtetorOng | null {
    if (!props) return null;
    const entity = new ProtetorOng(props.id, props.createdAt, props.updatedAt);
    entity._usuarioId = props.usuarioId;
    entity._cnpjCpf = props.cnpjCpf;
    entity._nomeOrganizacao = props.nomeOrganizacao;
    entity._enderecoId = props.enderecoId;
    entity._descricao = props.descricao;
    entity._imagemBase64 = props.imagemBase64;
    return entity;
  }

  static create(props: Omit<ProtetorOngProps, 'id' | 'createdAt' | 'updatedAt'>): ProtetorOng {
    const now = new Date();
    return ProtetorOng.restore({ ...props, id: crypto.randomUUID(), createdAt: now, updatedAt: now })!;
  }
}

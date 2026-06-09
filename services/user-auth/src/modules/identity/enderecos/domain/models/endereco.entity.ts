export interface EnderecoProps {
  id?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Endereco {
  private readonly _id?: string;
  private _cep: string;
  private _logradouro: string;
  private _numero: string;
  private _complemento?: string | null;
  private _bairro: string;
  private _cidade: string;
  private _estado: string;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined { return this._id; }
  get cep(): string { return this._cep; }
  get logradouro(): string { return this._logradouro; }
  get numero(): string { return this._numero; }
  get complemento(): string | null | undefined { return this._complemento; }
  get bairro(): string { return this._bairro; }
  get cidade(): string { return this._cidade; }
  get estado(): string { return this._estado; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  withCep(cep: string): this { this._cep = cep; return this; }
  withLogradouro(logradouro: string): this { this._logradouro = logradouro; return this; }
  withNumero(numero: string): this { this._numero = numero; return this; }
  withComplemento(complemento: string | null): this { this._complemento = complemento; return this; }
  withBairro(bairro: string): this { this._bairro = bairro; return this; }
  withCidade(cidade: string): this { this._cidade = cidade; return this; }
  withEstado(estado: string): this { this._estado = estado; return this; }
  touch(updatedAt: Date): this { this._updatedAt = updatedAt; return this; }

  static restore(props?: EnderecoProps | null): Endereco | null {
    if (!props) return null;
    const entity = new Endereco(props.id, props.createdAt, props.updatedAt);
    entity._cep = props.cep;
    entity._logradouro = props.logradouro;
    entity._numero = props.numero;
    entity._complemento = props.complemento;
    entity._bairro = props.bairro;
    entity._cidade = props.cidade;
    entity._estado = props.estado;
    return entity;
  }

  static create(props: Omit<EnderecoProps, 'id' | 'createdAt' | 'updatedAt'>): Endereco {
    const now = new Date();
    return Endereco.restore({ ...props, id: crypto.randomUUID(), createdAt: now, updatedAt: now })!;
  }
}

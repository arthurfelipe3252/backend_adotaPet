import { DomainException } from '@shared/domain/exceptions/domain.exception';

export interface EnderecoRestoreProps {
  id: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnderecoCreateProps {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

/**
 * Entidade rica de Endereço. Validação de formato (UF 2 letras maiúsculas,
 * CEP 8 dígitos) é feita no DTO via class-validator. Aqui ficam apenas as
 * invariantes de domínio (campos obrigatórios não-vazios).
 */
export class Endereco {
  private readonly _id?: string;
  private _logradouro!: string;
  private _numero!: string;
  private _complemento?: string;
  private _bairro!: string;
  private _cidade!: string;
  private _estado!: string;
  private _cep!: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }
  get logradouro(): string {
    return this._logradouro;
  }
  get numero(): string {
    return this._numero;
  }
  get complemento(): string | undefined {
    return this._complemento;
  }
  get bairro(): string {
    return this._bairro;
  }
  get cidade(): string {
    return this._cidade;
  }
  get estado(): string {
    return this._estado;
  }
  get cep(): string {
    return this._cep;
  }
  get createdAt(): Date | undefined {
    return this._createdAt;
  }
  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  withLogradouro(v: string): this {
    if (!v?.trim()) throw new DomainException('Logradouro é obrigatório');
    this._logradouro = v.trim();
    return this;
  }
  withNumero(v: string): this {
    if (!v?.trim()) throw new DomainException('Número é obrigatório');
    this._numero = v.trim();
    return this;
  }
  withComplemento(v?: string): this {
    this._complemento = v?.trim() || undefined;
    return this;
  }
  withBairro(v: string): this {
    if (!v?.trim()) throw new DomainException('Bairro é obrigatório');
    this._bairro = v.trim();
    return this;
  }
  withCidade(v: string): this {
    if (!v?.trim()) throw new DomainException('Cidade é obrigatória');
    this._cidade = v.trim();
    return this;
  }
  withEstado(v: string): this {
    if (!/^[A-Z]{2}$/.test(v))
      throw new DomainException('Estado deve ser sigla UF de 2 letras');
    this._estado = v;
    return this;
  }
  withCep(v: string): this {
    if (!/^\d{8}$/.test(v))
      throw new DomainException('CEP deve conter 8 dígitos');
    this._cep = v;
    return this;
  }

  static restaurar(props?: EnderecoRestoreProps | null): Endereco | null {
    if (!props) return null;
    const e = new Endereco(props.id, props.createdAt, props.updatedAt);
    e._logradouro = props.logradouro;
    e._numero = props.numero;
    e._complemento = props.complemento ?? undefined;
    e._bairro = props.bairro;
    e._cidade = props.cidade;
    e._estado = props.estado;
    e._cep = props.cep;
    return e;
  }

  static criar(props: EnderecoCreateProps): Endereco {
    const e = new Endereco();
    e.withLogradouro(props.logradouro)
      .withNumero(props.numero)
      .withComplemento(props.complemento)
      .withBairro(props.bairro)
      .withCidade(props.cidade)
      .withEstado(props.estado)
      .withCep(props.cep);
    return e;
  }
}

import { DomainException } from '@shared/domain/exceptions/domain.exception';

export interface AdotanteRestoreProps {
  id: string;
  usuarioId: string;
  cpf: string;
  enderecoId?: string | null;
  imagemBase64?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdotanteCreateProps {
  usuarioId: string;
  cpf: string;
  enderecoId?: string | null;
  imagemBase64?: string;
}

/**
 * Entidade rica do Adotante (perfil de pessoa física que adota).
 * 1:1 com Usuario (`usuarioId` é UNIQUE no banco).
 *
 * Validação de dígito verificador do CPF é feita pelo decorator @IsCPF
 * no DTO de entrada. Aqui só fica a invariante "11 dígitos".
 */
export class Adotante {
  private readonly _id?: string;
  private _usuarioId!: string;
  private _cpf!: string;
  private _enderecoId?: string | null;
  private _imagemBase64?: string;
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
  get usuarioId(): string {
    return this._usuarioId;
  }
  get cpf(): string {
    return this._cpf;
  }
  get enderecoId(): string | null | undefined {
    return this._enderecoId;
  }
  get imagemBase64(): string | undefined {
    return this._imagemBase64;
  }
  get createdAt(): Date | undefined {
    return this._createdAt;
  }
  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  withCpf(cpf: string): this {
    if (!/^\d{11}$/.test(cpf))
      throw new DomainException('CPF deve conter 11 dígitos');
    this._cpf = cpf;
    return this;
  }

  withEnderecoId(id?: string | null): this {
    this._enderecoId = id ?? null;
    return this;
  }

  withImagemBase64(v?: string): this {
    this._imagemBase64 = v?.trim() || undefined;
    return this;
  }

  static restaurar(props?: AdotanteRestoreProps | null): Adotante | null {
    if (!props) return null;
    const a = new Adotante(props.id, props.createdAt, props.updatedAt);
    a._usuarioId = props.usuarioId;
    a._cpf = props.cpf;
    a._enderecoId = props.enderecoId ?? null;
    a._imagemBase64 = props.imagemBase64 ?? undefined;
    return a;
  }

  static criar(props: AdotanteCreateProps): Adotante {
    const a = new Adotante();
    a._usuarioId = props.usuarioId;
    a.withCpf(props.cpf)
      .withEnderecoId(props.enderecoId)
      .withImagemBase64(props.imagemBase64);
    return a;
  }
}

import { DomainException } from '@shared/domain/exceptions/domain.exception';

export interface ProtetorOngRestoreProps {
  id: string;
  usuarioId: string;
  cpfCnpj: string;
  descricao?: string | null;
  telefoneContato?: string | null;
  imagemBase64?: string | null;
  documentoComprobatorio?: string | null;
  enderecoId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProtetorOngCreateProps {
  usuarioId: string;
  cpfCnpj: string;
  descricao?: string;
  telefoneContato?: string;
  imagemBase64?: string;
  documentoComprobatorio: string;
  enderecoId?: string | null;
}

/**
 * Entidade rica do Protetor/ONG. Armazena protetores pessoa física e
 * organizações na mesma estrutura — diferenciados apenas pela
 * `tipoUsuario` no usuário-mãe ('protetor' ou 'ong').
 *
 * O `documentoComprobatorio` (PDF/imagem em base64) é OBRIGATÓRIO porque
 * é prova de identidade/CNPJ usada por workflow futuro de aprovação.
 */
export class ProtetorOng {
  private readonly _id?: string;
  private _usuarioId!: string;
  private _cpfCnpj!: string;
  private _descricao?: string;
  private _telefoneContato?: string;
  private _imagemBase64?: string;
  private _documentoComprobatorio!: string;
  private _enderecoId?: string | null;
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
  get cpfCnpj(): string {
    return this._cpfCnpj;
  }
  get descricao(): string | undefined {
    return this._descricao;
  }
  get telefoneContato(): string | undefined {
    return this._telefoneContato;
  }
  get imagemBase64(): string | undefined {
    return this._imagemBase64;
  }
  get documentoComprobatorio(): string {
    return this._documentoComprobatorio;
  }
  get enderecoId(): string | null | undefined {
    return this._enderecoId;
  }
  get createdAt(): Date | undefined {
    return this._createdAt;
  }
  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  withCpfCnpj(v: string): this {
    if (!/^\d{11}$|^\d{14}$/.test(v)) {
      throw new DomainException(
        'cpfCnpj deve conter 11 dígitos (CPF) ou 14 (CNPJ)',
      );
    }
    this._cpfCnpj = v;
    return this;
  }

  withDescricao(v?: string): this {
    this._descricao = v?.trim() || undefined;
    return this;
  }

  withTelefoneContato(v?: string): this {
    this._telefoneContato = v?.trim() || undefined;
    return this;
  }

  withImagemBase64(v?: string): this {
    this._imagemBase64 = v?.trim() || undefined;
    return this;
  }

  withDocumentoComprobatorio(v: string): this {
    if (!v?.trim()) {
      throw new DomainException(
        'Documento comprobatório é obrigatório para protetor/ONG',
      );
    }
    this._documentoComprobatorio = v;
    return this;
  }

  withEnderecoId(id?: string | null): this {
    this._enderecoId = id ?? null;
    return this;
  }

  static restaurar(
    props?: ProtetorOngRestoreProps | null,
  ): ProtetorOng | null {
    if (!props) return null;
    const p = new ProtetorOng(props.id, props.createdAt, props.updatedAt);
    p._usuarioId = props.usuarioId;
    p._cpfCnpj = props.cpfCnpj;
    p._descricao = props.descricao ?? undefined;
    p._telefoneContato = props.telefoneContato ?? undefined;
    p._imagemBase64 = props.imagemBase64 ?? undefined;
    p._documentoComprobatorio = props.documentoComprobatorio ?? '';
    p._enderecoId = props.enderecoId ?? null;
    return p;
  }

  static criar(props: ProtetorOngCreateProps): ProtetorOng {
    const p = new ProtetorOng();
    p._usuarioId = props.usuarioId;
    p.withCpfCnpj(props.cpfCnpj)
      .withDescricao(props.descricao)
      .withTelefoneContato(props.telefoneContato)
      .withImagemBase64(props.imagemBase64)
      .withDocumentoComprobatorio(props.documentoComprobatorio)
      .withEnderecoId(props.enderecoId);
    return p;
  }
}

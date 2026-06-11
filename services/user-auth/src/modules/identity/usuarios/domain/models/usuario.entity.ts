import { DomainException } from '@shared/domain/exceptions/domain.exception';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

/**
 * Props que o repositório passa para reconstruir uma entidade vinda do banco.
 */
export interface UsuarioRestoreProps {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  telefone?: string | null;
  tipoUsuario: TipoUsuario;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props para criar um novo Usuario (ainda sem id, será gerado pelo banco).
 *
 * `imagemBase64` NÃO está aqui: a foto de perfil pertence à entidade filha
 * (Adotante / ProtetorOng), evitando duplicação de dados na tabela mãe.
 */
export interface UsuarioCreateProps {
  nome: string;
  email: string;
  senhaHash: string;
  telefone?: string;
  tipoUsuario: TipoUsuario;
}

/**
 * Entidade rica de domínio. Não conhece infra (Drizzle, NestJS, bcrypt).
 * A senha SEMPRE chega aqui já hasheada — quem hasheia é o serviço de aplicação.
 */
export class Usuario {
  private readonly _id?: string;
  private _nome!: string;
  private _email!: string;
  private _senhaHash!: string;
  private _telefone?: string;
  private _tipoUsuario!: TipoUsuario;
  private _ativo!: boolean;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // -------------------- getters --------------------

  get id(): string | undefined {
    return this._id;
  }

  get nome(): string {
    return this._nome;
  }

  get email(): string {
    return this._email;
  }

  get senhaHash(): string {
    return this._senhaHash;
  }

  get telefone(): string | undefined {
    return this._telefone;
  }

  get tipoUsuario(): TipoUsuario {
    return this._tipoUsuario;
  }

  get ativo(): boolean {
    return this._ativo;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // -------------------- builders fluent --------------------

  withNome(nome: string): this {
    if (!nome || nome.trim().length < 2) {
      throw new DomainException(
        'Nome do usuário precisa ter pelo menos 2 caracteres',
      );
    }
    this._nome = nome.trim();
    return this;
  }

  withEmail(email: string): this {
    if (!email || !email.includes('@')) {
      throw new DomainException('Email inválido');
    }
    // O CHECK constraint do banco exige email = LOWER(email).
    // Normalizamos aqui também para evitar dois caminhos divergentes.
    this._email = email.trim().toLowerCase();
    return this;
  }

  withSenhaHash(hash: string): this {
    if (!hash) {
      throw new DomainException('Hash de senha não pode ser vazio');
    }
    this._senhaHash = hash;
    return this;
  }

  withTelefone(telefone?: string): this {
    this._telefone = telefone;
    return this;
  }

  withTipoUsuario(tipo: TipoUsuario): this {
    this._tipoUsuario = tipo;
    return this;
  }

  ativar(): this {
    this._ativo = true;
    return this;
  }

  desativar(): this {
    this._ativo = false;
    return this;
  }

  // -------------------- factories --------------------

  /**
   * Reconstrói uma entidade a partir do que veio do banco.
   * Retorna null se props for null/undefined (caso "não encontrado").
   */
  static restaurar(props?: UsuarioRestoreProps | null): Usuario | null {
    if (!props) return null;
    const entity = new Usuario(props.id, props.createdAt, props.updatedAt);
    entity._nome = props.nome;
    entity._email = props.email;
    entity._senhaHash = props.senhaHash;
    entity._telefone = props.telefone ?? undefined;
    entity._tipoUsuario = props.tipoUsuario;
    entity._ativo = props.ativo;
    return entity;
  }

  /**
   * Cria um novo Usuario pronto para inserir no banco.
   * O id é gerado pelo banco. ativo começa como true.
   */
  static criar(props: UsuarioCreateProps): Usuario {
    const entity = new Usuario();
    entity
      .withNome(props.nome)
      .withEmail(props.email)
      .withSenhaHash(props.senhaHash)
      .withTelefone(props.telefone)
      .withTipoUsuario(props.tipoUsuario)
      .ativar();
    return entity;
  }
}

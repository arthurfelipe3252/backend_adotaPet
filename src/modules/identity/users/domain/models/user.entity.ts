export class User {
  private readonly _id?: string;
  private _name: string;
  private _email: string;
  private _cpfcnpj: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._name = "";
    this._email = "";
    this._cpfcnpj = "";
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get cpfcnpj(): string {
    return this._cpfcnpj;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  withName(name: string): User {
    this._name = name;
    return this;
  }

  withEmail(email: string): User {
    this._email = email;
    return this;
  }

  withCpfcnpj(cpfcnpj: string): User {
    this._cpfcnpj = cpfcnpj;
    return this;
  }

  static restore(props?: {
    id?: string;
    name: string;
    email: string;
    cpfcnpj: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): User | null {
    if (!props) {
      return null;
    }

    const entity = new User(props.id, props.createdAt, props.updatedAt);
    entity._name = props.name;
    entity._email = props.email;
    entity._cpfcnpj = props.cpfcnpj;
    return entity;
  }
}
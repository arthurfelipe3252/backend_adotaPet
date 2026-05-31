export interface ConversationProps {
  id?: string;
  adoptionRequestId: string;
  adopterId: string;
  protetorId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Conversation {
  private readonly _id?: string;
  private _adoptionRequestId: string;
  private _adopterId: string;
  private _protetorId: string;
  private _isActive: boolean;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get adoptionRequestId(): string {
    return this._adoptionRequestId;
  }

  get adopterId(): string {
    return this._adopterId;
  }

  get protetorId(): string {
    return this._protetorId;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  withActive(isActive: boolean) {
    this._isActive = isActive;
    return this;
  }

  touch(updatedAt: Date) {
    this._updatedAt = updatedAt;
    return this;
  }

  static create(
    props: Omit<ConversationProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Conversation {
    const now = new Date();
    const entity = new Conversation(undefined, now, now);
    entity._adoptionRequestId = props.adoptionRequestId;
    entity._adopterId = props.adopterId;
    entity._protetorId = props.protetorId;
    entity._isActive = props.isActive;
    return entity;
  }

  static restore(props?: ConversationProps | null): Conversation | null {
    if (!props) return null;
    const entity = new Conversation(props.id, props.createdAt, props.updatedAt);
    entity._adoptionRequestId = props.adoptionRequestId;
    entity._adopterId = props.adopterId;
    entity._protetorId = props.protetorId;
    entity._isActive = props.isActive;
    return entity;
  }
}

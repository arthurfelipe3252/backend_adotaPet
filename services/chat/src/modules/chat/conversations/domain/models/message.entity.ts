export interface MessageProps {
  id?: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Message {
  private readonly _id?: string;
  private _conversationId: string;
  private _senderId: string;
  private _content: string;
  private _isRead: boolean;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id; this._createdAt = createdAt; this._updatedAt = updatedAt;
  }

  get id(): string | undefined { return this._id; }
  get conversationId(): string { return this._conversationId; }
  get senderId(): string { return this._senderId; }
  get content(): string { return this._content; }
  get isRead(): boolean { return this._isRead; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  withRead(isRead: boolean) { this._isRead = isRead; return this; }
  touch(updatedAt: Date) { this._updatedAt = updatedAt; return this; }

  static create(props: Omit<MessageProps, 'id' | 'createdAt' | 'updatedAt'>): Message {
    const now = new Date();
    const entity = new Message(crypto.randomUUID(), now, now);
    entity._conversationId = props.conversationId;
    entity._senderId = props.senderId;
    entity._content = props.content;
    entity._isRead = props.isRead;
    return entity;
  }

  static restore(props?: MessageProps | null): Message | null {
    if (!props) return null;
    const entity = new Message(props.id, props.createdAt, props.updatedAt);
    entity._conversationId = props.conversationId;
    entity._senderId = props.senderId;
    entity._content = props.content;
    entity._isRead = props.isRead;
    return entity;
  }
}

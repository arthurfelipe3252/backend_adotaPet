import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Message } from '@chat/conversations/domain/models/message.entity';
import { MessageRepository } from '@chat/conversations/domain/repositories/message-repository.interface';
import {
  messagesSchema,
  MessageRow,
} from '@chat/conversations/infra/schemas/messages.schema';

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(message: Message): Promise<void> {
    await this.drizzle.db.insert(messagesSchema).values({
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt ?? new Date(),
      updatedAt: message.updatedAt ?? new Date(),
    });
  }

  async update(message: Message): Promise<void> {
    if (!message.id) return;

    await this.drizzle.db
      .update(messagesSchema)
      .set({
        isRead: message.isRead,
        updatedAt: message.updatedAt ?? new Date(),
      })
      .where(eq(messagesSchema.id, message.id));
  }

  async findById(id: string): Promise<Message | null> {
    const rows = await this.drizzle.db
      .select()
      .from(messagesSchema)
      .where(eq(messagesSchema.id, id))
      .limit(1);

    return this.toEntity(rows[0]);
  }

  async findByConversation(params: {
    conversationId: string;
    limit?: number;
    offset?: number;
  }): Promise<Message[]> {
    const query = this.drizzle.db
      .select()
      .from(messagesSchema)
      .where(eq(messagesSchema.conversationId, params.conversationId))
      .orderBy(asc(messagesSchema.createdAt));

    if (params.limit !== undefined) query.limit(params.limit);
    if (params.offset !== undefined) query.offset(params.offset);

    const rows = await query;
    return rows
      .map((row) => this.toEntity(row))
      .filter((row): row is Message => row !== null);
  }

  private toEntity(row?: MessageRow): Message | null {
    if (!row) return null;

    return Message.restore({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      content: row.content,
      isRead: row.isRead,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

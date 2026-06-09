import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Message } from '@chat/conversations/domain/models/message.entity';
import type { MessageRepository } from '@chat/conversations/domain/repositories/message-repository.interface';
import { messagesSchema, type MessageRow } from '../database/schemas/messages.schema';

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private toEntity(row: MessageRow): Message {
    return Message.restore({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      content: row.content,
      isRead: row.isRead,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  async create(message: Message): Promise<void> {
    await this.drizzle.db.insert(messagesSchema).values({
      id: message.id!,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
    });
  }

  async update(message: Message): Promise<void> {
    await this.drizzle.db.update(messagesSchema).set({
      isRead: message.isRead,
      updatedAt: new Date(),
    }).where(eq(messagesSchema.id, message.id!));
  }

  async findById(id: string): Promise<Message | null> {
    const rows = await this.drizzle.db.select().from(messagesSchema).where(eq(messagesSchema.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByConversation(params: { conversationId: string; limit?: number; offset?: number }): Promise<Message[]> {
    const query = this.drizzle.db.select().from(messagesSchema).where(eq(messagesSchema.conversationId, params.conversationId));
    if (params.limit) query.limit(params.limit);
    if (params.offset) query.offset(params.offset);
    const rows = await query;
    return rows.map((r) => this.toEntity(r));
  }
}

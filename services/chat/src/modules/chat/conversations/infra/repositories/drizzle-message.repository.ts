import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Message } from '@chat/conversations/domain/models/message.entity';
import type {
  LastMessageProjection,
  MessageRepository,
} from '@chat/conversations/domain/repositories/message-repository.interface';
import {
  messagesSchema,
  MessageRow,
} from '@chat/conversations/infra/schemas/messages.schema';

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(message: Message): Promise<Message> {
    const [row] = await this.drizzle.db
      .insert(messagesSchema)
      .values({
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt ?? new Date(),
        updatedAt: message.updatedAt ?? new Date(),
      })
      .returning();
    return this.toEntity(row)!;
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

  async countUnreadByConversationForViewer(params: {
    conversationIds: string[];
    viewerProfileId: string;
  }): Promise<Map<string, number>> {
    if (params.conversationIds.length === 0) return new Map();

    const rows = await this.drizzle.db
      .select({
        conversationId: messagesSchema.conversationId,
        total: sql<number>`count(*)::int`,
      })
      .from(messagesSchema)
      .where(
        and(
          inArray(messagesSchema.conversationId, params.conversationIds),
          ne(messagesSchema.senderId, params.viewerProfileId),
          eq(messagesSchema.isRead, false),
        ),
      )
      .groupBy(messagesSchema.conversationId);

    return new Map(rows.map((r) => [r.conversationId, r.total]));
  }

  async findLastMessageByConversation(
    conversationIds: string[],
  ): Promise<Map<string, LastMessageProjection>> {
    if (conversationIds.length === 0) return new Map();

    // DISTINCT ON (conversation_id) ordenado por created_at DESC pega
    // a última mensagem de cada conversa numa única query.
    const rows = await this.drizzle.db.execute<{
      conversation_id: string;
      content: string;
      sender_id: string;
      created_at: Date;
    }>(sql`
      SELECT DISTINCT ON (conversation_id)
        conversation_id, content, sender_id, created_at
      FROM messages
      WHERE conversation_id IN (${sql.join(
        conversationIds.map((id) => sql`${id}`),
        sql`, `,
      )})
      ORDER BY conversation_id, created_at DESC
    `);

    return new Map(
      rows.rows.map((r) => [
        r.conversation_id,
        {
          content: r.content,
          senderId: r.sender_id,
          createdAt: new Date(r.created_at),
        },
      ]),
    );
  }

  async markAllAsReadInConversation(params: {
    conversationId: string;
    viewerProfileId: string;
  }): Promise<number> {
    const updated = await this.drizzle.db
      .update(messagesSchema)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(messagesSchema.conversationId, params.conversationId),
          ne(messagesSchema.senderId, params.viewerProfileId),
          eq(messagesSchema.isRead, false),
        ),
      )
      .returning({ id: messagesSchema.id });

    return updated.length;
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

import { Injectable } from '@nestjs/common';
import { and, eq, SQL } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';
import {
  conversationsSchema,
  ConversationRow,
} from '@chat/conversations/infra/schemas/conversations.schema';
import { ConversationRepository } from '@chat/conversations/domain/repositories/conversation-repository.interface';

@Injectable()
export class DrizzleConversationRepository implements ConversationRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(conversation: Conversation): Promise<void> {
    await this.drizzle.db.insert(conversationsSchema).values({
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt ?? new Date(),
      updatedAt: conversation.updatedAt ?? new Date(),
    });
  }

  async update(conversation: Conversation): Promise<void> {
    if (!conversation.id) return;

    await this.drizzle.db
      .update(conversationsSchema)
      .set({
        isActive: conversation.isActive,
        updatedAt: conversation.updatedAt ?? new Date(),
      })
      .where(eq(conversationsSchema.id, conversation.id));
  }

  async findById(id: string): Promise<Conversation | null> {
    const rows = await this.drizzle.db
      .select()
      .from(conversationsSchema)
      .where(eq(conversationsSchema.id, id))
      .limit(1);

    return this.toEntity(rows[0]);
  }

  async findByAdoptionRequestId(
    adoptionRequestId: string,
  ): Promise<Conversation | null> {
    const rows = await this.drizzle.db
      .select()
      .from(conversationsSchema)
      .where(eq(conversationsSchema.adoptionRequestId, adoptionRequestId))
      .limit(1);

    return this.toEntity(rows[0]);
  }

  async findByParticipant(params: {
    adopterId?: string;
    protetorId?: string;
  }): Promise<Conversation[]> {
    const conditions: SQL[] = [];

    if (params.adopterId) {
      conditions.push(eq(conversationsSchema.adopterId, params.adopterId));
    }

    if (params.protetorId) {
      conditions.push(eq(conversationsSchema.protetorId, params.protetorId));
    }

    const rows = await this.drizzle.db
      .select()
      .from(conversationsSchema)
      .where(conditions.length ? and(...conditions) : undefined);

    return rows
      .map((row) => this.toEntity(row))
      .filter((row): row is Conversation => row !== null);
  }

  private toEntity(row?: ConversationRow): Conversation | null {
    if (!row) return null;

    return Conversation.restore({
      id: row.id,
      adoptionRequestId: row.adoptionRequestId,
      adopterId: row.adopterId,
      protetorId: row.protetorId,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

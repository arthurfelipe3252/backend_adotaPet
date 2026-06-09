import { Injectable } from '@nestjs/common';
import { count, eq, or } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Conversation } from '@chat/conversations/domain/models/conversation.entity';
import type { ConversationRepository } from '@chat/conversations/domain/repositories/conversation-repository.interface';
import { conversationsSchema, type ConversationRow } from '../database/schemas/conversations.schema';

@Injectable()
export class DrizzleConversationRepository implements ConversationRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private toEntity(row: ConversationRow): Conversation {
    return Conversation.restore({
      id: row.id,
      adoptionRequestId: row.adoptionRequestId,
      adopterId: row.adopterId,
      protetorId: row.protetorId,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  async create(conversation: Conversation): Promise<void> {
    await this.drizzle.db.insert(conversationsSchema).values({
      id: conversation.id!,
      adoptionRequestId: conversation.adoptionRequestId,
      adopterId: conversation.adopterId,
      protetorId: conversation.protetorId,
      isActive: conversation.isActive,
    });
  }

  async update(conversation: Conversation): Promise<void> {
    await this.drizzle.db.update(conversationsSchema).set({
      isActive: conversation.isActive,
      updatedAt: new Date(),
    }).where(eq(conversationsSchema.id, conversation.id!));
  }

  async findById(id: string): Promise<Conversation | null> {
    const rows = await this.drizzle.db.select().from(conversationsSchema).where(eq(conversationsSchema.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findAllPaginated(params: PaginationParams): Promise<{ rows: Conversation[]; total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const [rows, [countResult]] = await Promise.all([
      this.drizzle.db.select().from(conversationsSchema).limit(limit).offset(offset),
      this.drizzle.db.select({ count: count() }).from(conversationsSchema),
    ]);
    return { rows: rows.map((r) => this.toEntity(r)), total: countResult.count };
  }

  async findByAdoptionRequestId(adoptionRequestId: string): Promise<Conversation | null> {
    const rows = await this.drizzle.db.select().from(conversationsSchema).where(eq(conversationsSchema.adoptionRequestId, adoptionRequestId)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByParticipant(params: { adopterId?: string; protetorId?: string }): Promise<Conversation[]> {
    const conditions = [];
    if (params.adopterId) conditions.push(eq(conversationsSchema.adopterId, params.adopterId));
    if (params.protetorId) conditions.push(eq(conversationsSchema.protetorId, params.protetorId));
    if (conditions.length === 0) return [];
    const rows = await this.drizzle.db.select().from(conversationsSchema).where(or(...conditions));
    return rows.map((r) => this.toEntity(r));
  }
}

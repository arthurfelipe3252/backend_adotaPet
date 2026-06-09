import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { PaginationParams } from '@shared/infra/hateoas';
import {
  AdoptionRequest,
  type AdoptionPreTriageStatus,
  type AdoptionRequestStatus,
} from '@adoption/adoption-requests/domain/models/adoption-request.entity';
import type { AdoptionRequestRepository } from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';
import { adoptionRequestsSchema } from '../database/schemas/adoption-requests.schema';

type Row = typeof adoptionRequestsSchema.$inferSelect;

@Injectable()
export class DrizzleAdoptionRequestRepository implements AdoptionRequestRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(request: AdoptionRequest): Promise<void> {
    await this.drizzle.db.insert(adoptionRequestsSchema).values({
      id: request.id!,
      petId: request.petId,
      protetorId: request.protetorId ?? null,
      adopterId: request.adopterId,
      status: request.status,
      preTriageStatus: request.preTriageStatus,
      matchScore: request.matchScore ?? null,
      matchAnswers: request.matchAnswers ?? null,
      notes: request.notes ?? null,
      createdAt: request.createdAt ?? new Date(),
      updatedAt: request.updatedAt ?? new Date(),
    });
  }

  async update(request: AdoptionRequest): Promise<void> {
    if (!request.id) return;
    await this.drizzle.db.update(adoptionRequestsSchema).set({
      status: request.status,
      preTriageStatus: request.preTriageStatus,
      matchScore: request.matchScore ?? null,
      matchAnswers: request.matchAnswers ?? null,
      notes: request.notes ?? null,
      protetorId: request.protetorId ?? null,
      updatedAt: request.updatedAt ?? new Date(),
    }).where(eq(adoptionRequestsSchema.id, request.id));
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db.delete(adoptionRequestsSchema).where(eq(adoptionRequestsSchema.id, id));
  }

  async findAll(): Promise<AdoptionRequest[]> {
    const rows = await this.drizzle.db.select().from(adoptionRequestsSchema);
    return rows.map((r) => this.toEntity(r)).filter((r): r is AdoptionRequest => r !== null);
  }

  async findAllPaginated(params: PaginationParams): Promise<{ rows: AdoptionRequest[]; total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const [rows, [countResult]] = await Promise.all([
      this.drizzle.db.select().from(adoptionRequestsSchema).limit(limit).offset(offset),
      this.drizzle.db.select({ count: count() }).from(adoptionRequestsSchema),
    ]);
    return { rows: rows.map((r) => this.toEntity(r)).filter((r): r is AdoptionRequest => r !== null), total: countResult.count };
  }

  async findById(id: string): Promise<AdoptionRequest | null> {
    const rows = await this.drizzle.db.select().from(adoptionRequestsSchema).where(eq(adoptionRequestsSchema.id, id));
    return this.toEntity(rows[0]);
  }

  async findByAdopterId(adopterId: string): Promise<AdoptionRequest[]> {
    const rows = await this.drizzle.db.select().from(adoptionRequestsSchema).where(eq(adoptionRequestsSchema.adopterId, adopterId));
    return rows.map((r) => this.toEntity(r)).filter((r): r is AdoptionRequest => r !== null);
  }

  async findByProtetorId(protetorId: string): Promise<AdoptionRequest[]> {
    const rows = await this.drizzle.db.select().from(adoptionRequestsSchema).where(eq(adoptionRequestsSchema.protetorId, protetorId));
    return rows.map((r) => this.toEntity(r)).filter((r): r is AdoptionRequest => r !== null);
  }

  private toEntity(record?: Row): AdoptionRequest | null {
    if (!record) return null;
    return AdoptionRequest.restore({
      id: record.id,
      petId: record.petId,
      protetorId: record.protetorId,
      adopterId: record.adopterId,
      status: record.status as AdoptionRequestStatus,
      preTriageStatus: record.preTriageStatus as AdoptionPreTriageStatus,
      matchScore: record.matchScore,
      matchAnswers: record.matchAnswers as Record<string, string | number | boolean | null> | null,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { adoptionRequestsSchema } from "@adoption/adoption-requests/infra/schemas/adoption-requests.schema";
import {
  AdoptionRequest,
  type AdoptionPreTriageStatus,
  type AdoptionRequestStatus,
} from "@adoption/adoption-requests/domain/models/adoption-request.entity";
import { type AdoptionRequestRepository } from "@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface";

type AdoptionRequestRecord = typeof adoptionRequestsSchema.$inferSelect;

@Injectable()
export class DrizzleAdoptionRequestRepository implements AdoptionRequestRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(request: AdoptionRequest): Promise<void> {
    await this.drizzle.db.insert(adoptionRequestsSchema).values({
      petId: request.petId,
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

    await this.drizzle.db
      .update(adoptionRequestsSchema)
      .set({
        status: request.status,
        preTriageStatus: request.preTriageStatus,
        matchScore: request.matchScore ?? null,
        matchAnswers: request.matchAnswers ?? null,
        notes: request.notes ?? null,
        updatedAt: request.updatedAt ?? new Date(),
      })
      .where(eq(adoptionRequestsSchema.id, request.id));
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(adoptionRequestsSchema)
      .where(eq(adoptionRequestsSchema.id, id));
  }

  async findAll(): Promise<AdoptionRequest[]> {
    const rows = await this.drizzle.db.select().from(adoptionRequestsSchema);
    return rows
      .map((row) => this.mapToEntity(row))
      .filter((row): row is AdoptionRequest => row !== null);
  }

  async findById(id: string): Promise<AdoptionRequest | null> {
    const rows = await this.drizzle.db
      .select()
      .from(adoptionRequestsSchema)
      .where(eq(adoptionRequestsSchema.id, id));

    return this.mapToEntity(rows[0]);
  }

  private mapToEntity(record?: AdoptionRequestRecord): AdoptionRequest | null {
    if (!record) return null;

    return AdoptionRequest.restore({
      id: record.id,
      petId: record.petId,
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

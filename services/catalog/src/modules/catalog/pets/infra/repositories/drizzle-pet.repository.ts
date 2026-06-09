import { Injectable } from '@nestjs/common';
import { and, count, eq, SQL } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Pet } from '@catalog/pets/domain/models/pet.entity';
import type { PetFilters, PetRepository } from '@catalog/pets/domain/repositories/pet-repository.interface';
import { petsSchema, type PetRow } from '../database/schemas/pet.schema';

@Injectable()
export class DrizzlePetRepository implements PetRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private parseFotosUrls(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }

  private toEntity(row: PetRow): Pet {
    return Pet.restore({
      id: row.id,
      protetorId: row.protetorId,
      nome: row.nome,
      especie: row.especie,
      raca: row.raca,
      porte: row.porte,
      sexo: row.sexo,
      idadeMeses: row.idadeMeses,
      castrado: row.castrado,
      vacinado: row.vacinado,
      descricao: row.descricao,
      temperamento: row.temperamento,
      status: row.status,
      fotosUrls: this.parseFotosUrls(row.fotosUrls),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  private buildConditions(filters?: PetFilters): SQL[] {
    const conditions: SQL[] = [];
    if (filters?.especie) conditions.push(eq(petsSchema.especie, filters.especie));
    if (filters?.porte) conditions.push(eq(petsSchema.porte, filters.porte));
    if (filters?.status) conditions.push(eq(petsSchema.status, filters.status));
    if (filters?.castrado !== undefined) conditions.push(eq(petsSchema.castrado, filters.castrado));
    if (filters?.protetorId) conditions.push(eq(petsSchema.protetorId, filters.protetorId));
    return conditions;
  }

  async create(pet: Pet): Promise<Pet> {
    const [row] = await this.drizzle.db.insert(petsSchema).values({
      id: pet.id!,
      protetorId: pet.protetorId,
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
      porte: pet.porte,
      sexo: pet.sexo,
      idadeMeses: pet.idadeMeses,
      castrado: pet.castrado,
      vacinado: pet.vacinado,
      descricao: pet.descricao,
      temperamento: pet.temperamento,
      status: pet.status,
      fotosUrls: pet.fotosUrls ? JSON.stringify(pet.fotosUrls) : null,
      createdAt: pet.createdAt!,
      updatedAt: pet.updatedAt!,
    }).returning();
    return this.toEntity(row);
  }

  async update(pet: Pet): Promise<void> {
    await this.drizzle.db.update(petsSchema).set({
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
      porte: pet.porte,
      sexo: pet.sexo,
      idadeMeses: pet.idadeMeses,
      castrado: pet.castrado,
      vacinado: pet.vacinado,
      descricao: pet.descricao,
      temperamento: pet.temperamento,
      status: pet.status,
      fotosUrls: pet.fotosUrls ? JSON.stringify(pet.fotosUrls) : null,
      updatedAt: new Date(),
    }).where(eq(petsSchema.id, pet.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db.delete(petsSchema).where(eq(petsSchema.id, id));
  }

  async findAll(filters?: PetFilters): Promise<Pet[]> {
    const conditions = this.buildConditions(filters);
    const rows = await this.drizzle.db.select().from(petsSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return rows.map((r) => this.toEntity(r));
  }

  async findAllPaginated(
    params: PaginationParams,
    filters?: PetFilters,
  ): Promise<{ rows: Pet[]; total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const conditions = this.buildConditions(filters);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [countResult]] = await Promise.all([
      this.drizzle.db.select().from(petsSchema).where(where).limit(limit).offset(offset),
      this.drizzle.db.select({ count: count() }).from(petsSchema).where(where),
    ]);

    return { rows: rows.map((r) => this.toEntity(r)), total: countResult.count };
  }

  async findById(id: string): Promise<Pet | null> {
    const rows = await this.drizzle.db.select().from(petsSchema)
      .where(eq(petsSchema.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByProtetor(protetorId: string): Promise<Pet[]> {
    const rows = await this.drizzle.db.select().from(petsSchema)
      .where(eq(petsSchema.protetorId, protetorId));
    return rows.map((r) => this.toEntity(r));
  }
}

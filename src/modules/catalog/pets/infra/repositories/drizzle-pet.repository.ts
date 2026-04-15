import { Injectable } from "@nestjs/common";
import { eq, and, SQL } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Pet } from "../../domain/models/pet.entity";
import {
  PetRepository,
  PetFilters,
} from "../../domain/repositories/pet-repository.interface";
import { petsSchema, PetRow } from "../schemas/pet.schema";

@Injectable()
export class DrizzlePetRepository implements PetRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  // ── Mapeamento row → entidade ──────────────────────────────────────────────

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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(pet: Pet): Promise<void> {
    await this.drizzle.db.insert(petsSchema).values({
      id: pet.id,
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
      createdAt: pet.createdAt!,
      updatedAt: pet.updatedAt!,
    });
  }

  async update(pet: Pet): Promise<void> {
    await this.drizzle.db
      .update(petsSchema)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(petsSchema.id, pet.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(petsSchema)
      .where(eq(petsSchema.id, id));
  }

  async findAll(filters?: PetFilters): Promise<Pet[]> {
    const conditions: SQL[] = [];

    if (filters?.especie) {
      conditions.push(eq(petsSchema.especie, filters.especie));
    }
    if (filters?.porte) {
      conditions.push(eq(petsSchema.porte, filters.porte));
    }
    if (filters?.status) {
      conditions.push(eq(petsSchema.status, filters.status));
    }
    if (filters?.castrado !== undefined) {
      conditions.push(eq(petsSchema.castrado, filters.castrado));
    }
    if (filters?.protetorId) {
      conditions.push(eq(petsSchema.protetorId, filters.protetorId));
    }

    const rows = await this.drizzle.db
      .select()
      .from(petsSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Pet | null> {
    const rows = await this.drizzle.db
      .select()
      .from(petsSchema)
      .where(eq(petsSchema.id, id))
      .limit(1);

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByProtetor(protetorId: string): Promise<Pet[]> {
    const rows = await this.drizzle.db
      .select()
      .from(petsSchema)
      .where(eq(petsSchema.protetorId, protetorId));

    return rows.map((r) => this.toEntity(r));
  }
}

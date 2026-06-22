import { Injectable } from '@nestjs/common';
import { eq, and, count, SQL } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Pet } from '../../domain/models/pet.entity';
import {
  PetRepository,
  PetFilters,
} from '../../domain/repositories/pet-repository.interface';
import { petsSchema, PetRow } from '../schemas/pet.schema';

@Injectable()
export class DrizzlePetRepository implements PetRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Converte JSON string armazenada em array (ou [] se nulo/inválido) */
  private parseFotosUrls(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
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

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(pet: Pet): Promise<Pet> {
    const [row] = await this.drizzle.db
      .insert(petsSchema)
      .values({
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
      })
      .returning();

    return this.toEntity(row);
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
        fotosUrls: pet.fotosUrls ? JSON.stringify(pet.fotosUrls) : null,
        updatedAt: new Date(),
      })
      .where(eq(petsSchema.id, pet.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db.delete(petsSchema).where(eq(petsSchema.id, id));
  }

  async findAll(filters?: PetFilters): Promise<{ rows: Pet[]; total: number }> {
    const conditions: SQL[] = [];

    if (filters?.especie)
      conditions.push(eq(petsSchema.especie, filters.especie));
    if (filters?.porte) conditions.push(eq(petsSchema.porte, filters.porte));
    if (filters?.status) conditions.push(eq(petsSchema.status, filters.status));
    if (filters?.castrado !== undefined)
      conditions.push(eq(petsSchema.castrado, filters.castrado));
    if (filters?.protetorId)
      conditions.push(eq(petsSchema.protetorId, filters.protetorId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Contagem completa do filtro (independe do recorte de paginação).
    const [{ value: total }] = await this.drizzle.db
      .select({ value: count() })
      .from(petsSchema)
      .where(where);

    // Recorte paginado. $dynamic() permite aplicar limit/offset condicionalmente.
    let query = this.drizzle.db.select().from(petsSchema).where(where).$dynamic();
    if (filters?.limit !== undefined) query = query.limit(filters.limit);
    if (filters?.offset !== undefined) query = query.offset(filters.offset);
    const rows = await query;

    return { rows: rows.map((r) => this.toEntity(r)), total: Number(total) };
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

import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';
import type { AdotanteRepository } from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import { adotantesSchema, type AdotanteRow } from '../database/schemas/adotantes.schema';

@Injectable()
export class DrizzleAdotanteRepository implements AdotanteRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private toEntity(row: AdotanteRow): Adotante {
    return Adotante.restore({
      id: row.id,
      usuarioId: row.usuarioId,
      cpf: row.cpf,
      enderecoId: row.enderecoId,
      imagemBase64: row.imagemBase64,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  async create(adotante: Adotante): Promise<void> {
    await this.drizzle.db.insert(adotantesSchema).values({
      id: adotante.id!,
      usuarioId: adotante.usuarioId,
      cpf: adotante.cpf,
      enderecoId: adotante.enderecoId,
      imagemBase64: adotante.imagemBase64 ?? null,
      createdAt: adotante.createdAt!,
      updatedAt: adotante.updatedAt!,
    });
  }

  async update(adotante: Adotante): Promise<void> {
    await this.drizzle.db.update(adotantesSchema).set({
      cpf: adotante.cpf,
      enderecoId: adotante.enderecoId,
      imagemBase64: adotante.imagemBase64 ?? null,
      updatedAt: new Date(),
    }).where(eq(adotantesSchema.id, adotante.id!));
  }

  async findAll(): Promise<Adotante[]> {
    const rows = await this.drizzle.db.select().from(adotantesSchema);
    return rows.map((r) => this.toEntity(r));
  }

  async findAllPaginated(params: PaginationParams): Promise<{ rows: Adotante[]; total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const [rows, [countResult]] = await Promise.all([
      this.drizzle.db.select().from(adotantesSchema).limit(limit).offset(offset),
      this.drizzle.db.select({ count: count() }).from(adotantesSchema),
    ]);
    return { rows: rows.map((r) => this.toEntity(r)), total: countResult.count };
  }

  async findById(id: string): Promise<Adotante | null> {
    const rows = await this.drizzle.db.select().from(adotantesSchema)
      .where(eq(adotantesSchema.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByUsuarioId(usuarioId: string): Promise<Adotante | null> {
    const rows = await this.drizzle.db.select().from(adotantesSchema)
      .where(eq(adotantesSchema.usuarioId, usuarioId)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}

import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { PaginationParams } from '@shared/infra/hateoas';
import { ProtetorOng } from '@identity/protetores-ongs/domain/models/protetor-ong.entity';
import type { ProtetorOngRepository } from '@identity/protetores-ongs/domain/repositories/protetor-ong-repository.interface';
import { protetoresOngsSchema, type ProtetorOngRow } from '../database/schemas/protetores-ongs.schema';

@Injectable()
export class DrizzleProtetorOngRepository implements ProtetorOngRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private toEntity(row: ProtetorOngRow): ProtetorOng {
    return ProtetorOng.restore({
      id: row.id,
      usuarioId: row.usuarioId,
      cnpjCpf: row.cnpjCpf,
      nomeOrganizacao: row.nomeOrganizacao,
      enderecoId: row.enderecoId,
      descricao: row.descricao,
      imagemBase64: row.imagemBase64,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  async create(protetor: ProtetorOng): Promise<void> {
    await this.drizzle.db.insert(protetoresOngsSchema).values({
      id: protetor.id!,
      usuarioId: protetor.usuarioId,
      cnpjCpf: protetor.cnpjCpf,
      nomeOrganizacao: protetor.nomeOrganizacao ?? null,
      enderecoId: protetor.enderecoId,
      descricao: protetor.descricao ?? null,
      imagemBase64: protetor.imagemBase64 ?? null,
      createdAt: protetor.createdAt!,
      updatedAt: protetor.updatedAt!,
    });
  }

  async update(protetor: ProtetorOng): Promise<void> {
    await this.drizzle.db.update(protetoresOngsSchema).set({
      nomeOrganizacao: protetor.nomeOrganizacao ?? null,
      enderecoId: protetor.enderecoId,
      descricao: protetor.descricao ?? null,
      imagemBase64: protetor.imagemBase64 ?? null,
      updatedAt: new Date(),
    }).where(eq(protetoresOngsSchema.id, protetor.id!));
  }

  async findAll(): Promise<ProtetorOng[]> {
    const rows = await this.drizzle.db.select().from(protetoresOngsSchema);
    return rows.map((r) => this.toEntity(r));
  }

  async findAllPaginated(params: PaginationParams): Promise<{ rows: ProtetorOng[]; total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const [rows, [countResult]] = await Promise.all([
      this.drizzle.db.select().from(protetoresOngsSchema).limit(limit).offset(offset),
      this.drizzle.db.select({ count: count() }).from(protetoresOngsSchema),
    ]);
    return { rows: rows.map((r) => this.toEntity(r)), total: countResult.count };
  }

  async findById(id: string): Promise<ProtetorOng | null> {
    const rows = await this.drizzle.db.select().from(protetoresOngsSchema)
      .where(eq(protetoresOngsSchema.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByUsuarioId(usuarioId: string): Promise<ProtetorOng | null> {
    const rows = await this.drizzle.db.select().from(protetoresOngsSchema)
      .where(eq(protetoresOngsSchema.usuarioId, usuarioId)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}

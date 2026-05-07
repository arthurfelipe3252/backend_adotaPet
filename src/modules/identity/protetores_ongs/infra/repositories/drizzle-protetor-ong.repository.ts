import { ConflictException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { DbExecutor } from '@shared/infra/database/types';
import { ProtetorOng } from '@identity/protetores_ongs/domain/models/protetor-ong.entity';
import { ProtetorOngRepository } from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import {
  protetoresOngsSchema,
  ProtetorOngRow,
} from '@identity/protetores_ongs/infra/schemas/protetores-ongs.schema';

@Injectable()
export class DrizzleProtetorOngRepository implements ProtetorOngRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async criar(
    protetor: ProtetorOng,
    executor?: DbExecutor,
  ): Promise<ProtetorOng> {
    const db = executor ?? this.drizzle.db;
    try {
      const [row] = await db
        .insert(protetoresOngsSchema)
        .values({
          usuarioId: protetor.usuarioId,
          cpfCnpj: protetor.cpfCnpj,
          descricao: protetor.descricao,
          telefoneContato: protetor.telefoneContato,
          imagemBase64: protetor.imagemBase64,
          documentoComprobatorio: protetor.documentoComprobatorio,
          enderecoId: protetor.enderecoId ?? null,
        })
        .returning();
      return ProtetorOng.restaurar(this.paraDominio(row))!;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('CPF/CNPJ já cadastrado');
      }
      throw error;
    }
  }

  async buscarPorCpfCnpj(cpfCnpj: string): Promise<ProtetorOng | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(protetoresOngsSchema)
      .where(eq(protetoresOngsSchema.cpfCnpj, cpfCnpj))
      .limit(1);
    return ProtetorOng.restaurar(row ? this.paraDominio(row) : null);
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<ProtetorOng | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(protetoresOngsSchema)
      .where(eq(protetoresOngsSchema.usuarioId, usuarioId))
      .limit(1);
    return ProtetorOng.restaurar(row ? this.paraDominio(row) : null);
  }

  async atualizar(
    protetor: ProtetorOng,
    executor?: DbExecutor,
  ): Promise<ProtetorOng> {
    const db = executor ?? this.drizzle.db;
    const [row] = await db
      .update(protetoresOngsSchema)
      .set({
        descricao: protetor.descricao,
        telefoneContato: protetor.telefoneContato,
        imagemBase64: protetor.imagemBase64,
        documentoComprobatorio: protetor.documentoComprobatorio,
        enderecoId: protetor.enderecoId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(protetoresOngsSchema.id, protetor.id!))
      .returning();
    return ProtetorOng.restaurar(this.paraDominio(row))!;
  }

  private paraDominio(row: ProtetorOngRow) {
    return {
      id: row.id,
      usuarioId: row.usuarioId,
      cpfCnpj: row.cpfCnpj,
      descricao: row.descricao,
      telefoneContato: row.telefoneContato,
      imagemBase64: row.imagemBase64,
      documentoComprobatorio: row.documentoComprobatorio,
      enderecoId: row.enderecoId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === '23505'
    );
  }
}

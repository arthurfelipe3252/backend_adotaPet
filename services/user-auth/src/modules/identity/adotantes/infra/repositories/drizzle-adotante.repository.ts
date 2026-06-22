import { ConflictException, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { DbExecutor } from '@shared/infra/database/types';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';
import {
  AdotanteRepository,
  type AdotanteSummary,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import {
  adotantesSchema,
  AdotanteRow,
} from '@identity/adotantes/infra/schemas/adotantes.schema';
import { usuariosSchema } from '@identity/usuarios/infra/schemas/usuarios.schema';

@Injectable()
export class DrizzleAdotanteRepository implements AdotanteRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async criar(adotante: Adotante, executor?: DbExecutor): Promise<Adotante> {
    const db = executor ?? this.drizzle.db;
    try {
      const [row] = await db
        .insert(adotantesSchema)
        .values({
          usuarioId: adotante.usuarioId,
          cpf: adotante.cpf,
          enderecoId: adotante.enderecoId ?? null,
          imagemBase64: adotante.imagemBase64,
        })
        .returning();
      return Adotante.restaurar(this.paraDominio(row))!;
    } catch (error) {
      // 23505 = unique_violation. Pode ser cpf duplicado ou usuario_id
      // duplicado (caso a transação inclua um usuário já adotante — não
      // deveria acontecer, mas defendemos).
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('CPF já cadastrado');
      }
      throw error;
    }
  }

  async buscarPorCpf(cpf: string): Promise<Adotante | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(adotantesSchema)
      .where(eq(adotantesSchema.cpf, cpf))
      .limit(1);
    return Adotante.restaurar(row ? this.paraDominio(row) : null);
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Adotante | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(adotantesSchema)
      .where(eq(adotantesSchema.usuarioId, usuarioId))
      .limit(1);
    return Adotante.restaurar(row ? this.paraDominio(row) : null);
  }

  async findSummariesByIds(ids: string[]): Promise<AdotanteSummary[]> {
    if (ids.length === 0) return [];
    return this.drizzle.db
      .select({
        id: adotantesSchema.id,
        nome: usuariosSchema.nome,
      })
      .from(adotantesSchema)
      .innerJoin(
        usuariosSchema,
        eq(adotantesSchema.usuarioId, usuariosSchema.id),
      )
      .where(inArray(adotantesSchema.id, ids));
  }

  async atualizar(
    adotante: Adotante,
    executor?: DbExecutor,
  ): Promise<Adotante> {
    const db = executor ?? this.drizzle.db;
    const [row] = await db
      .update(adotantesSchema)
      .set({
        enderecoId: adotante.enderecoId ?? null,
        imagemBase64: adotante.imagemBase64,
        updatedAt: new Date(),
      })
      .where(eq(adotantesSchema.id, adotante.id!))
      .returning();
    return Adotante.restaurar(this.paraDominio(row))!;
  }

  private paraDominio(row: AdotanteRow) {
    return {
      id: row.id,
      usuarioId: row.usuarioId,
      cpf: row.cpf,
      enderecoId: row.enderecoId,
      imagemBase64: row.imagemBase64,
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

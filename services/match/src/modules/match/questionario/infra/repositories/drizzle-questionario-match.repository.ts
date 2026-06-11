import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { QuestionarioMatch } from '../../domain/models/questionario-match.entity';
import type { QuestionarioMatchRepository } from '../../domain/repositories/questionario-match-repository.interface';
import {
  questionarioMatchSchema,
  type QuestionarioMatchRow,
} from '../schemas/questionario-match.schema';

@Injectable()
export class DrizzleQuestionarioMatchRepository implements QuestionarioMatchRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  // ── Mapeamento row → entidade ──────────────────────────────────────────────

  private toEntity(row: QuestionarioMatchRow): QuestionarioMatch {
    return QuestionarioMatch.restore({
      id: row.id,
      adotanteId: row.adotanteId,
      tipoMoradia: row.tipoMoradia,
      disponibilidade: row.disponibilidade,
      experienciaPrevia: row.experienciaPrevia,
      criancasEmCasa: row.criancasEmCasa,
      outrosPets: row.outrosPets,
      perfilCompanheiro: row.perfilCompanheiro,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // ── Operações ──────────────────────────────────────────────────────────────

  async upsert(q: QuestionarioMatch): Promise<QuestionarioMatch> {
    const now = new Date();

    const [row] = await this.drizzle.db
      .insert(questionarioMatchSchema)
      .values({
        adotanteId: q.adotanteId,
        tipoMoradia: q.tipoMoradia,
        disponibilidade: q.disponibilidade,
        experienciaPrevia: q.experienciaPrevia,
        criancasEmCasa: q.criancasEmCasa,
        outrosPets: q.outrosPets,
        perfilCompanheiro: q.perfilCompanheiro,
        createdAt: q.createdAt ?? now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: questionarioMatchSchema.adotanteId,
        set: {
          tipoMoradia: q.tipoMoradia,
          disponibilidade: q.disponibilidade,
          experienciaPrevia: q.experienciaPrevia,
          criancasEmCasa: q.criancasEmCasa,
          outrosPets: q.outrosPets,
          perfilCompanheiro: q.perfilCompanheiro,
          updatedAt: now,
        },
      })
      .returning();

    return this.toEntity(row);
  }

  async findByAdotanteId(
    adotanteId: string,
  ): Promise<QuestionarioMatch | null> {
    const rows = await this.drizzle.db
      .select()
      .from(questionarioMatchSchema)
      .where(eq(questionarioMatchSchema.adotanteId, adotanteId))
      .limit(1);

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async deleteByAdotanteId(adotanteId: string): Promise<void> {
    await this.drizzle.db
      .delete(questionarioMatchSchema)
      .where(eq(questionarioMatchSchema.adotanteId, adotanteId));
  }
}

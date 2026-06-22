import { Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { reportAdoptionRequestsSchema as adoptionRequestsSchema } from '@reports/reporting-dashboard/infra/schemas/adoption-requests.schema';
import { reportPetsSchema as petsSchema } from '@reports/reporting-dashboard/infra/schemas/pets.schema';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type {
  PetsReporting,
  PetStatusCounts,
  PetSummaryRow,
  StalePetRow,
} from '@reports/reporting-dashboard/domain/ports/pets-reporting.port';

/**
 * ⚠️ CROSS-CONTEXT TEMPORÁRIO
 *
 * Este adapter lê diretamente da tabela `pets` (bounded context @catalog)
 * e faz LEFT JOIN com `adoption_requests` (bounded context @adoption),
 * infringindo a regra do CLAUDE.md sobre desacoplamento entre contextos.
 *
 * Decisão de produto: aceitar a violação no MVP do dashboard. Este arquivo
 * será SUBSTITUÍDO quando o módulo @reports ganhar banco próprio (schema
 * `reports.*`) populado por consumer RabbitMQ. As interfaces (ports), o
 * service e o controller NÃO mudam. Não estenda esse padrão para outros
 * módulos do projeto.
 */
@Injectable()
export class DrizzlePetsReportingAdapter implements PetsReporting {
  constructor(private readonly drizzle: DrizzleService) {}

  async countByStatus(protetorId: string): Promise<PetStatusCounts> {
    const rows = await this.drizzle.db
      .select({
        status: petsSchema.status,
        total: sql<number>`count(*)::int`,
      })
      .from(petsSchema)
      .where(eq(petsSchema.protetorId, protetorId))
      .groupBy(petsSchema.status);

    const counts: PetStatusCounts = {
      disponivel: 0,
      emProcesso: 0,
      adotado: 0,
      total: 0,
    };

    for (const row of rows) {
      counts.total += row.total;
      if (row.status === 'disponivel') counts.disponivel = row.total;
      else if (row.status === 'em_processo') counts.emProcesso = row.total;
      else if (row.status === 'adotado') counts.adotado = row.total;
    }

    return counts;
  }

  async findStalePets(
    protetorId: string,
    daysWithoutRequest: number,
  ): Promise<StalePetRow[]> {
    // Calculamos o cutoff no JS e passamos como timestamp parametrizado —
    // evita concatenar valor inteiro dentro de SQL literal.
    const cutoffDate = new Date(
      Date.now() - daysWithoutRequest * 24 * 60 * 60 * 1000,
    );

    // LEFT JOIN com filtro de data no ON. Pets sem solicitações recentes
    // (incluindo os que nunca tiveram nenhuma) caem com `r.id IS NULL`.
    const rows = await this.drizzle.db
      .select({
        id: petsSchema.id,
        nome: petsSchema.nome,
        especie: petsSchema.especie,
        porte: petsSchema.porte,
        status: petsSchema.status,
        createdAt: petsSchema.createdAt,
      })
      .from(petsSchema)
      .leftJoin(
        adoptionRequestsSchema,
        and(
          eq(adoptionRequestsSchema.petId, petsSchema.id),
          gte(adoptionRequestsSchema.createdAt, cutoffDate),
        ),
      )
      .where(
        and(
          eq(petsSchema.protetorId, protetorId),
          eq(petsSchema.status, 'disponivel'),
          isNull(adoptionRequestsSchema.id),
        ),
      )
      .orderBy(asc(petsSchema.createdAt));

    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      especie: r.especie,
      porte: r.porte,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }

  async findByIds(ids: string[]): Promise<PetSummaryRow[]> {
    if (ids.length === 0) return [];

    const rows = await this.drizzle.db
      .select({
        id: petsSchema.id,
        nome: petsSchema.nome,
        especie: petsSchema.especie,
        porte: petsSchema.porte,
        status: petsSchema.status,
      })
      .from(petsSchema)
      .where(inArray(petsSchema.id, ids));

    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      especie: r.especie,
      porte: r.porte,
      status: r.status,
    }));
  }
}

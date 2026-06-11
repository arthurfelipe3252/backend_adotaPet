import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { type AnyPgColumn } from 'drizzle-orm/pg-core';
import { reportAdoptionRequestsSchema as adoptionRequestsSchema } from '@reports/reporting-dashboard/infra/schemas/adoption-requests.schema';
import { reportPetsSchema as petsSchema } from '@reports/reporting-dashboard/infra/schemas/pets.schema';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type {
  AdoptionReporting,
  StatusCounts,
  TimelineBucket,
  TopRequestedPet,
} from '@reports/reporting-dashboard/domain/ports/adoption-reporting.port';

/**
 * ⚠️ CROSS-CONTEXT TEMPORÁRIO  — ver header em drizzle-pets-reporting.adapter.ts.
 *
 * Detalhe importante: `adoption_requests.protetor_id` é nullable (adicionado
 * pela migration 0006). Para incluir registros antigos (NULL), fazemos
 * INNER JOIN com `pets` e usamos COALESCE(req.protetor_id, pet.protetor_id)
 * como filtro de protetor. Custo: 1 JOIN extra por query — aceitável no MVP.
 */
@Injectable()
export class DrizzleAdoptionReportingAdapter implements AdoptionReporting {
  constructor(private readonly drizzle: DrizzleService) {}

  async statusCounts(
    protetorId: string,
    from?: Date,
    to?: Date,
  ): Promise<StatusCounts> {
    const conditions = [this.protetorFilter(protetorId)];
    if (from) conditions.push(gte(adoptionRequestsSchema.createdAt, from));
    if (to) conditions.push(lte(adoptionRequestsSchema.createdAt, to));

    const rows = await this.drizzle.db
      .select({
        status: adoptionRequestsSchema.status,
        total: sql<number>`count(*)::int`,
      })
      .from(adoptionRequestsSchema)
      .innerJoin(petsSchema, eq(petsSchema.id, adoptionRequestsSchema.petId))
      .where(and(...conditions))
      .groupBy(adoptionRequestsSchema.status);

    const counts: StatusCounts = {
      received: 0,
      inAnalysis: 0,
      approved: 0,
      rejected: 0,
    };

    for (const row of rows) {
      switch (row.status) {
        case 'received':
          counts.received = row.total;
          break;
        case 'in_analysis':
          counts.inAnalysis = row.total;
          break;
        case 'approved':
          counts.approved = row.total;
          break;
        case 'rejected':
          counts.rejected = row.total;
          break;
      }
    }

    return counts;
  }

  async countApprovedInCurrentMonth(protetorId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const [row] = await this.drizzle.db
      .select({ total: sql<number>`count(*)::int` })
      .from(adoptionRequestsSchema)
      .innerJoin(petsSchema, eq(petsSchema.id, adoptionRequestsSchema.petId))
      .where(
        and(
          this.protetorFilter(protetorId),
          eq(adoptionRequestsSchema.status, 'approved'),
          gte(adoptionRequestsSchema.updatedAt, monthStart),
        ),
      );

    return row?.total ?? 0;
  }

  async averageDaysToAdoption(protetorId: string): Promise<number | null> {
    // EPOCH em segundos → /86400 = dias. AVG retorna NULL se não houver
    // linhas — devolvemos null nesse caso (sem média definida).
    const [row] = await this.drizzle.db
      .select({
        avg: sql<
          string | null
        >`AVG(EXTRACT(EPOCH FROM (${adoptionRequestsSchema.updatedAt} - ${adoptionRequestsSchema.createdAt})) / 86400)`,
      })
      .from(adoptionRequestsSchema)
      .innerJoin(petsSchema, eq(petsSchema.id, adoptionRequestsSchema.petId))
      .where(
        and(
          this.protetorFilter(protetorId),
          eq(adoptionRequestsSchema.status, 'approved'),
        ),
      );

    if (row?.avg === null || row?.avg === undefined) return null;
    const parsed = Number(row.avg);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async adoptionsTimelineByMonth(
    protetorId: string,
    months: number,
  ): Promise<TimelineBucket[]> {
    const cutoff = this.monthsAgoUtc(months);
    return this.timelineByMonth(
      protetorId,
      cutoff,
      adoptionRequestsSchema.updatedAt,
      eq(adoptionRequestsSchema.status, 'approved'),
    );
  }

  async requestsTimelineByMonth(
    protetorId: string,
    months: number,
  ): Promise<TimelineBucket[]> {
    const cutoff = this.monthsAgoUtc(months);
    return this.timelineByMonth(
      protetorId,
      cutoff,
      adoptionRequestsSchema.createdAt,
    );
  }

  async topRequestedPets(
    protetorId: string,
    limit: number,
  ): Promise<TopRequestedPet[]> {
    const rows = await this.drizzle.db
      .select({
        petId: adoptionRequestsSchema.petId,
        total: sql<number>`count(*)::int`,
      })
      .from(adoptionRequestsSchema)
      .innerJoin(petsSchema, eq(petsSchema.id, adoptionRequestsSchema.petId))
      .where(this.protetorFilter(protetorId))
      .groupBy(adoptionRequestsSchema.petId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return rows.map((r) => ({ petId: r.petId, totalRequests: r.total }));
  }

  // ------------------------------------------------------------------
  // helpers privados
  // ------------------------------------------------------------------

  /**
   * Filtro de protetor com fallback para registros antigos onde
   * `adoption_requests.protetor_id` ainda é NULL. Resolvemos via JOIN
   * com `pets` (que sempre tem protetor_id NOT NULL).
   */
  private protetorFilter(protetorId: string) {
    return sql`COALESCE(${adoptionRequestsSchema.protetorId}, ${petsSchema.protetorId}) = ${protetorId}`;
  }

  private async timelineByMonth(
    protetorId: string,
    cutoff: Date,
    timestampColumn: AnyPgColumn,
    extraCondition?: SQL,
  ): Promise<TimelineBucket[]> {
    // date_trunc retorna timestamptz no início do mês. AT TIME ZONE 'UTC'
    // garante determinismo (evita drift por timezone da sessão).
    const bucketExpr = sql<Date>`date_trunc('month', ${timestampColumn} AT TIME ZONE 'UTC')`;

    const conditions = [
      this.protetorFilter(protetorId),
      gte(timestampColumn, cutoff),
    ];
    if (extraCondition) conditions.push(extraCondition);

    const rows = await this.drizzle.db
      .select({
        bucket: bucketExpr,
        total: sql<number>`count(*)::int`,
      })
      .from(adoptionRequestsSchema)
      .innerJoin(petsSchema, eq(petsSchema.id, adoptionRequestsSchema.petId))
      .where(and(...conditions))
      .groupBy(bucketExpr)
      .orderBy(bucketExpr);

    return rows.map((r) => ({
      monthStart: new Date(r.bucket),
      count: r.total,
    }));
  }

  /**
   * Primeiro dia do mês `months-1` atrás (em UTC). Garante que o cutoff
   * inclua o mês completo, não cortando registros pelo dia.
   */
  private monthsAgoUtc(months: number): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
    );
  }
}

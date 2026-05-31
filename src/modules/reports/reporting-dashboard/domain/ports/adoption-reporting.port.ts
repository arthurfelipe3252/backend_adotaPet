/**
 * Contrato de leitura agregada do bounded context @adoption para o dashboard.
 * Ver header em pets-reporting.port.ts para racional.
 */

export const ADOPTION_REPORTING = Symbol('ADOPTION_REPORTING');

export interface StatusCounts {
  received: number;
  inAnalysis: number;
  approved: number;
  rejected: number;
}

export interface TimelineBucket {
  /** Primeiro dia do mês em UTC (00:00:00.000Z). */
  monthStart: Date;
  count: number;
}

export interface TopRequestedPet {
  petId: string;
  totalRequests: number;
}

export interface AdoptionReporting {
  /**
   * Conta solicitações por status. Com `from`/`to` filtra
   * `created_at BETWEEN from AND to`. Sem janela = all-time.
   * Statuses ausentes retornam 0.
   */
  statusCounts(
    protetorId: string,
    from?: Date,
    to?: Date,
  ): Promise<StatusCounts>;

  /**
   * Solicitações aprovadas (status='approved') cujo `updated_at` está
   * dentro do mês corrente (UTC).
   */
  countApprovedInCurrentMonth(protetorId: string): Promise<number>;

  /**
   * Média (em dias) entre `created_at` e `updated_at` das solicitações
   * aprovadas. Proxy para "tempo até adoção" porque `pets` não tem
   * `adopted_at`. Retorna null se não houver nenhuma adoção.
   */
  averageDaysToAdoption(protetorId: string): Promise<number | null>;

  /**
   * Buckets mensais de adoções (status='approved' agrupado por
   * `date_trunc('month', updated_at)`). Apenas meses com dados — o service
   * preenche os meses vazios com count=0.
   */
  adoptionsTimelineByMonth(
    protetorId: string,
    months: number,
  ): Promise<TimelineBucket[]>;

  /**
   * Buckets mensais de solicitações recebidas (agrupado por
   * `date_trunc('month', created_at)`).
   */
  requestsTimelineByMonth(
    protetorId: string,
    months: number,
  ): Promise<TimelineBucket[]>;

  /**
   * Top N pets ordenados por total de solicitações recebidas (desc).
   * Retorna apenas petId + total — quem chama precisa enriquecer com
   * `PetsReporting.findByIds` se quiser dados como nome/espécie.
   */
  topRequestedPets(
    protetorId: string,
    limit: number,
  ): Promise<TopRequestedPet[]>;
}

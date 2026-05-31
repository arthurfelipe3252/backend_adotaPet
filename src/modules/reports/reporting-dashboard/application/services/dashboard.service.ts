import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PROTETOR_ONG_REPOSITORY,
  type ProtetorOngRepository,
} from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import { DashboardQueryDto } from '@reports/reporting-dashboard/application/dto/dashboard-query.dto';
import { DashboardResponseDto } from '@reports/reporting-dashboard/application/dto/dashboard-response.dto';
import { FunnelResponseDto } from '@reports/reporting-dashboard/application/dto/funnel-response.dto';
import { KpisResponseDto } from '@reports/reporting-dashboard/application/dto/kpis-response.dto';
import { StalePetDto } from '@reports/reporting-dashboard/application/dto/stale-pet.dto';
import { TimelinePointDto } from '@reports/reporting-dashboard/application/dto/timeline-point.dto';
import { TopPetDto } from '@reports/reporting-dashboard/application/dto/top-pet.dto';
import {
  ADOPTION_REPORTING,
  type AdoptionReporting,
  type TimelineBucket,
} from '@reports/reporting-dashboard/domain/ports/adoption-reporting.port';
import {
  CHAT_REPORTING,
  type ChatReporting,
} from '@reports/reporting-dashboard/domain/ports/chat-reporting.port';
import {
  PETS_REPORTING,
  type PetsReporting,
} from '@reports/reporting-dashboard/domain/ports/pets-reporting.port';

/**
 * Service de aplicação do dashboard de relatórios.
 *
 * Orquestra as três ports (pets, adoption, chat) para montar os payloads
 * do dashboard. Toda chamada externa entra por `resolveProtetorId`, que
 * cuida do ownership check (tipoUsuario ∈ {protetor, ong}) e converte
 * o `usuarioId` do JWT no `protetorId` (= protetores_ongs.id) usado nas
 * tabelas operacionais.
 */
@Injectable()
export class DashboardService {
  constructor(
    @Inject(PETS_REPORTING)
    private readonly petsReporting: PetsReporting,
    @Inject(ADOPTION_REPORTING)
    private readonly adoptionReporting: AdoptionReporting,
    @Inject(CHAT_REPORTING)
    private readonly chatReporting: ChatReporting,
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorRepository: ProtetorOngRepository,
  ) {}

  /**
   * Bloqueia adotantes/outros tipos e resolve `protetorId` via repositório.
   * Lança 403 se tipo errado; 404 se o usuário não tem perfil filho de
   * protetor/ong (caso defensivo — não deveria acontecer porque cadastro
   * é atômico, mas protege contra dados inconsistentes).
   */
  async resolveProtetorId(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<string> {
    if (
      tipoUsuario !== TipoUsuario.Protetor &&
      tipoUsuario !== TipoUsuario.Ong
    ) {
      throw new ForbiddenException(
        'Dashboard disponível apenas para usuários do tipo protetor ou ong',
      );
    }

    const protetor =
      await this.protetorRepository.buscarPorUsuarioId(usuarioId);
    if (!protetor?.id) {
      throw new NotFoundException(
        'Perfil de protetor/ong não encontrado para o usuário autenticado',
      );
    }

    return protetor.id;
  }

  async getKpis(protetorId: string): Promise<KpisResponseDto> {
    const [
      petStatus,
      requestCounts,
      approvedInMonth,
      avgDays,
      activeConversations,
      unreadMessages,
    ] = await Promise.all([
      this.petsReporting.countByStatus(protetorId),
      this.adoptionReporting.statusCounts(protetorId),
      this.adoptionReporting.countApprovedInCurrentMonth(protetorId),
      this.adoptionReporting.averageDaysToAdoption(protetorId),
      this.chatReporting.countActiveConversations(protetorId),
      this.chatReporting.countUnreadMessagesForProtetor(protetorId),
    ]);

    const totalRequests =
      requestCounts.received +
      requestCounts.inAnalysis +
      requestCounts.approved +
      requestCounts.rejected;

    // null em vez de 0 quando não há nenhuma solicitação (0/0 não é
    // definido — frontend exibe "—" ao invés de "0% de conversão").
    const taxaConversao =
      totalRequests > 0
        ? Number(((requestCounts.approved / totalRequests) * 100).toFixed(2))
        : null;

    const dto = new KpisResponseDto();
    dto.petsDisponivel = petStatus.disponivel;
    dto.petsEmProcesso = petStatus.emProcesso;
    dto.petsAdotadoTotal = petStatus.adotado;
    dto.petsAdotadoMesAtual = approvedInMonth;
    dto.solicitacoesPendentes =
      requestCounts.received + requestCounts.inAnalysis;
    dto.conversasAtivas = activeConversations;
    dto.mensagensNaoLidas = unreadMessages;
    dto.taxaConversaoPct = taxaConversao;
    dto.tempoMedioAdocaoDias =
      avgDays !== null ? Number(avgDays.toFixed(2)) : null;
    return dto;
  }

  async getAdoptionsTimeline(
    protetorId: string,
    months: number,
  ): Promise<TimelinePointDto[]> {
    const buckets = await this.adoptionReporting.adoptionsTimelineByMonth(
      protetorId,
      months,
    );
    return this.fillTimelineGaps(buckets, months);
  }

  async getRequestsTimeline(
    protetorId: string,
    months: number,
  ): Promise<TimelinePointDto[]> {
    const buckets = await this.adoptionReporting.requestsTimelineByMonth(
      protetorId,
      months,
    );
    return this.fillTimelineGaps(buckets, months);
  }

  async getFunnel(
    protetorId: string,
    from?: Date,
    to?: Date,
  ): Promise<FunnelResponseDto> {
    const now = new Date();
    const defaultFrom = new Date(
      Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()),
    );

    const counts = await this.adoptionReporting.statusCounts(
      protetorId,
      from ?? defaultFrom,
      to ?? now,
    );

    const dto = new FunnelResponseDto();
    dto.received = counts.received;
    dto.inAnalysis = counts.inAnalysis;
    dto.approved = counts.approved;
    dto.rejected = counts.rejected;
    return dto;
  }

  async getTopPets(protetorId: string, limit: number): Promise<TopPetDto[]> {
    const top = await this.adoptionReporting.topRequestedPets(
      protetorId,
      limit,
    );
    if (top.length === 0) return [];

    const pets = await this.petsReporting.findByIds(top.map((t) => t.petId));
    const petsById = new Map(pets.map((p) => [p.id, p]));

    // Filtramos pets ausentes (caso raro: pet excluído entre a query agregada
    // e o enriquecimento). Mantemos a ordem original do top.
    return top
      .map((t): TopPetDto | null => {
        const p = petsById.get(t.petId);
        if (!p) return null;
        const dto = new TopPetDto();
        dto.petId = t.petId;
        dto.nome = p.nome;
        dto.especie = p.especie;
        dto.porte = p.porte;
        dto.status = p.status;
        dto.totalRequests = t.totalRequests;
        return dto;
      })
      .filter((d): d is TopPetDto => d !== null);
  }

  async getStalePets(protetorId: string, days: number): Promise<StalePetDto[]> {
    const stale = await this.petsReporting.findStalePets(protetorId, days);
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    return stale.map((p) => {
      const dto = new StalePetDto();
      dto.id = p.id;
      dto.nome = p.nome;
      dto.especie = p.especie;
      dto.porte = p.porte;
      dto.createdAt = p.createdAt;
      dto.diasNoCatalogo = Math.floor((now - p.createdAt.getTime()) / msPerDay);
      return dto;
    });
  }

  async getDashboard(
    protetorId: string,
    query: DashboardQueryDto,
  ): Promise<DashboardResponseDto> {
    const months = query.months ?? 12;
    const topLimit = query.topLimit ?? 5;
    const staleDays = query.staleDays ?? 30;

    const [
      kpis,
      adoptionsTimeline,
      requestsTimeline,
      funnel,
      topPets,
      stalePets,
    ] = await Promise.all([
      this.getKpis(protetorId),
      this.getAdoptionsTimeline(protetorId, months),
      this.getRequestsTimeline(protetorId, months),
      this.getFunnel(protetorId),
      this.getTopPets(protetorId, topLimit),
      this.getStalePets(protetorId, staleDays),
    ]);

    const dto = new DashboardResponseDto();
    dto.kpis = kpis;
    dto.adoptionsTimeline = adoptionsTimeline;
    dto.requestsTimeline = requestsTimeline;
    dto.funnel = funnel;
    dto.topPets = topPets;
    dto.stalePets = stalePets;
    return dto;
  }

  /**
   * Preenche meses ausentes com count=0 e devolve exatamente `months`
   * pontos consecutivos terminando no mês corrente. Garante que o frontend
   * receba uma série contínua para renderizar linha sem gaps.
   *
   * Ex: months=3, hoje em maio/2026, buckets retornados pela query =
   *   [abril/2026:5]
   * → resultado = [março/2026:0, abril/2026:5, maio/2026:0]
   */
  private fillTimelineGaps(
    buckets: TimelineBucket[],
    months: number,
  ): TimelinePointDto[] {
    const byKey = new Map<string, number>();
    for (const b of buckets) {
      byKey.set(this.monthKey(b.monthStart), b.count);
    }

    const now = new Date();
    const startYear = now.getUTCFullYear();
    const startMonth = now.getUTCMonth() - (months - 1);
    const result: TimelinePointDto[] = [];

    for (let i = 0; i < months; i++) {
      const cursor = new Date(Date.UTC(startYear, startMonth + i, 1));
      const dto = new TimelinePointDto();
      dto.monthStart = cursor;
      dto.count = byKey.get(this.monthKey(cursor)) ?? 0;
      result.push(dto);
    }
    return result;
  }

  private monthKey(d: Date): string {
    return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
  }
}

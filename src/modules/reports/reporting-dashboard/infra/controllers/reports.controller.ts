import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import {
  DashboardQueryDto,
  FunnelQueryDto,
  StalePetsQueryDto,
  TimelineQueryDto,
  TopPetsQueryDto,
} from '@reports/reporting-dashboard/application/dto/dashboard-query.dto';
import { DashboardResponseDto } from '@reports/reporting-dashboard/application/dto/dashboard-response.dto';
import { FunnelResponseDto } from '@reports/reporting-dashboard/application/dto/funnel-response.dto';
import { KpisResponseDto } from '@reports/reporting-dashboard/application/dto/kpis-response.dto';
import { StalePetDto } from '@reports/reporting-dashboard/application/dto/stale-pet.dto';
import { TimelinePointDto } from '@reports/reporting-dashboard/application/dto/timeline-point.dto';
import { TopPetDto } from '@reports/reporting-dashboard/application/dto/top-pet.dto';
import { DashboardService } from '@reports/reporting-dashboard/application/services/dashboard.service';

/**
 * Endpoints do dashboard da home de ONGs/protetores.
 *
 * Todos sob `/api/v1/reports/dashboard` (prefixo global `/api/v1` aplicado
 * em main.ts). Todos requerem JWT válido + tipoUsuario ∈ {protetor, ong} —
 * a checagem de tipo é feita dentro do service via `resolveProtetorId`.
 *
 * Convenção de status:
 *  - 200 OK  ........ resposta com dados (ou listas/objetos vazios se sem dados)
 *  - 400 BAD ........ query params inválidos (tratado pelo ValidationPipe global)
 *  - 401 UNAUTH ..... JWT ausente/inválido (tratado pelo JwtAuthGuard)
 *  - 403 FORBIDDEN .. tipoUsuario não permitido
 *  - 404 NOT FOUND .. usuário do JWT não tem perfil de protetor/ong
 */
@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports/dashboard')
export class ReportsController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ----------------------------------------------------------------
  // GET /api/v1/reports/dashboard — payload agregado
  // ----------------------------------------------------------------
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna o payload completo do dashboard',
    description:
      'Junta KPIs, séries temporais (adoções/solicitações), funil, top pets ' +
      'mais solicitados e lista de pets parados em uma única resposta. ' +
      'Conveniente para o load inicial da home da ONG/protetor — evita ' +
      'que o frontend dispare 6 requests separados.',
  })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  @ApiResponse({ status: 400, description: 'Query params inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado para o usuário',
  })
  async getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardResponseDto> {
    const protetorId = await this.dashboardService.resolveProtetorId(
      user.id,
      user.tipoUsuario,
    );
    return this.dashboardService.getDashboard(protetorId, query);
  }

  // ----------------------------------------------------------------
  // GET /api/v1/reports/dashboard/kpis
  // ----------------------------------------------------------------
  @Get('kpis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna os KPIs do topo do dashboard',
    description:
      '9 números agregados: pets por status (disponivel, em_processo, ' +
      'adotado total, adotado no mês atual), solicitações pendentes, ' +
      'conversas ativas, mensagens não lidas, taxa de conversão e tempo ' +
      'médio até adoção.',
  })
  @ApiResponse({ status: 200, type: KpisResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado',
  })
  async getKpis(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<KpisResponseDto> {
    const protetorId = await this.dashboardService.resolveProtetorId(
      user.id,
      user.tipoUsuario,
    );
    return this.dashboardService.getKpis(protetorId);
  }

  // ----------------------------------------------------------------
  // GET /api/v1/reports/dashboard/adoptions-timeline?months=12
  // ----------------------------------------------------------------
  @Get('adoptions-timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Série temporal mensal de adoções aprovadas',
    description:
      'Retorna N buckets mensais (default 12, range 1-60) com a contagem ' +
      'de solicitações que terminaram em status=approved no mês. Meses ' +
      'sem adoção são incluídos com count=0 para linha contínua no gráfico.',
  })
  @ApiResponse({ status: 200, type: [TimelinePointDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro months inválido (1-60)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado',
  })
  async getAdoptionsTimeline(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TimelineQueryDto,
  ): Promise<TimelinePointDto[]> {
    const protetorId = await this.dashboardService.resolveProtetorId(
      user.id,
      user.tipoUsuario,
    );
    return this.dashboardService.getAdoptionsTimeline(
      protetorId,
      query.months ?? 12,
    );
  }

  // ----------------------------------------------------------------
  // GET /api/v1/reports/dashboard/requests-timeline?months=12
  // ----------------------------------------------------------------
  @Get('requests-timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Série temporal mensal de solicitações recebidas',
    description:
      'Retorna N buckets mensais (default 12, range 1-60) com a contagem ' +
      'de solicitações criadas no mês (qualquer status). Meses vazios ' +
      'retornam count=0.',
  })
  @ApiResponse({ status: 200, type: [TimelinePointDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro months inválido (1-60)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado',
  })
  async getRequestsTimeline(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TimelineQueryDto,
  ): Promise<TimelinePointDto[]> {
    const protetorId = await this.dashboardService.resolveProtetorId(
      user.id,
      user.tipoUsuario,
    );
    return this.dashboardService.getRequestsTimeline(
      protetorId,
      query.months ?? 12,
    );
  }

  // ----------------------------------------------------------------
  // GET /api/v1/reports/dashboard/funnel?from=&to=
  // ----------------------------------------------------------------
  @Get('funnel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Funil de status das solicitações na janela',
    description:
      'Conta solicitações por status (received, in_analysis, approved, ' +
      'rejected) no intervalo [from, to]. Default = últimos 12 meses ' +
      'até o instante da requisição.',
  })
  @ApiResponse({ status: 200, type: FunnelResponseDto })
  @ApiResponse({ status: 400, description: 'Datas inválidas em from/to' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado',
  })
  async getFunnel(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FunnelQueryDto,
  ): Promise<FunnelResponseDto> {
    const protetorId = await this.dashboardService.resolveProtetorId(
      user.id,
      user.tipoUsuario,
    );
    return this.dashboardService.getFunnel(protetorId, query.from, query.to);
  }

  // ----------------------------------------------------------------
  // GET /api/v1/reports/dashboard/top-pets?limit=5
  // ----------------------------------------------------------------
  @Get('top-pets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pets mais solicitados (rank por total de solicitações)',
    description:
      'Retorna até N (default 5, range 1-50) pets ordenados pela quantidade ' +
      'de solicitações de adoção recebidas (qualquer status). Útil para ' +
      'a ONG priorizar atenção/atendimento.',
  })
  @ApiResponse({ status: 200, type: [TopPetDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro limit inválido (1-50)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado',
  })
  async getTopPets(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TopPetsQueryDto,
  ): Promise<TopPetDto[]> {
    const protetorId = await this.dashboardService.resolveProtetorId(
      user.id,
      user.tipoUsuario,
    );
    return this.dashboardService.getTopPets(protetorId, query.limit ?? 5);
  }

  // ----------------------------------------------------------------
  // GET /api/v1/reports/dashboard/stale-pets?days=30
  // ----------------------------------------------------------------
  @Get('stale-pets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pets disponíveis parados há +N dias sem solicitação',
    description:
      'Lista pets com status=disponivel que NÃO receberam nenhuma ' +
      'solicitação nos últimos N dias (default 30, range 1-365). ' +
      'Sinaliza problemas de visibilidade ou anúncios com qualidade ruim.',
  })
  @ApiResponse({ status: 200, type: [StalePetDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro days inválido (1-365)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado não é protetor nem ong',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de protetor/ong não encontrado',
  })
  async getStalePets(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StalePetsQueryDto,
  ): Promise<StalePetDto[]> {
    const protetorId = await this.dashboardService.resolveProtetorId(
      user.id,
      user.tipoUsuario,
    );
    return this.dashboardService.getStalePets(protetorId, query.days ?? 30);
  }
}

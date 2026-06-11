import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { Permission } from '@shared/domain/enums/permission.enum';
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

interface JwtUser {
  sub: string;
  tipoUsuario: string;
  permissions: string[];
}

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports/dashboard')
export class ReportsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Retorna o payload completo do dashboard' })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  @ApiResponse({ status: 400, description: 'Query params inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não é protetor nem ong' })
  async getDashboard(
    @CurrentUser() user: JwtUser,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardResponseDto> {
    const protetorId = this.dashboardService.resolveProtetorId(user.sub, user.tipoUsuario);
    return this.dashboardService.getDashboard(protetorId, query);
  }

  @Get('kpis')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Retorna os KPIs do topo do dashboard' })
  @ApiResponse({ status: 200, type: KpisResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não é protetor nem ong' })
  async getKpis(@CurrentUser() user: JwtUser): Promise<KpisResponseDto> {
    const protetorId = this.dashboardService.resolveProtetorId(user.sub, user.tipoUsuario);
    return this.dashboardService.getKpis(protetorId);
  }

  @Get('adoptions-timeline')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Série temporal mensal de adoções aprovadas' })
  @ApiResponse({ status: 200, type: [TimelinePointDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro months inválido (1-60)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não é protetor nem ong' })
  async getAdoptionsTimeline(
    @CurrentUser() user: JwtUser,
    @Query() query: TimelineQueryDto,
  ): Promise<TimelinePointDto[]> {
    const protetorId = this.dashboardService.resolveProtetorId(user.sub, user.tipoUsuario);
    return this.dashboardService.getAdoptionsTimeline(protetorId, query.months ?? 12);
  }

  @Get('requests-timeline')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Série temporal mensal de solicitações recebidas' })
  @ApiResponse({ status: 200, type: [TimelinePointDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro months inválido (1-60)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não é protetor nem ong' })
  async getRequestsTimeline(
    @CurrentUser() user: JwtUser,
    @Query() query: TimelineQueryDto,
  ): Promise<TimelinePointDto[]> {
    const protetorId = this.dashboardService.resolveProtetorId(user.sub, user.tipoUsuario);
    return this.dashboardService.getRequestsTimeline(protetorId, query.months ?? 12);
  }

  @Get('funnel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Funil de status das solicitações na janela' })
  @ApiResponse({ status: 200, type: FunnelResponseDto })
  @ApiResponse({ status: 400, description: 'Datas inválidas em from/to' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não é protetor nem ong' })
  async getFunnel(
    @CurrentUser() user: JwtUser,
    @Query() query: FunnelQueryDto,
  ): Promise<FunnelResponseDto> {
    const protetorId = this.dashboardService.resolveProtetorId(user.sub, user.tipoUsuario);
    return this.dashboardService.getFunnel(protetorId, query.from, query.to);
  }

  @Get('top-pets')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Pets mais solicitados (rank por total de solicitações)' })
  @ApiResponse({ status: 200, type: [TopPetDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro limit inválido (1-50)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não é protetor nem ong' })
  async getTopPets(
    @CurrentUser() user: JwtUser,
    @Query() query: TopPetsQueryDto,
  ): Promise<TopPetDto[]> {
    const protetorId = this.dashboardService.resolveProtetorId(user.sub, user.tipoUsuario);
    return this.dashboardService.getTopPets(protetorId, query.limit ?? 5);
  }

  @Get('stale-pets')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Pets disponíveis parados há +N dias sem solicitação' })
  @ApiResponse({ status: 200, type: [StalePetDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro days inválido (1-365)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não é protetor nem ong' })
  async getStalePets(
    @CurrentUser() user: JwtUser,
    @Query() query: StalePetsQueryDto,
  ): Promise<StalePetDto[]> {
    const protetorId = this.dashboardService.resolveProtetorId(user.sub, user.tipoUsuario);
    return this.dashboardService.getStalePets(protetorId, query.days ?? 30);
  }
}

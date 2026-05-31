import { ApiProperty } from '@nestjs/swagger';
import { FunnelResponseDto } from '@reports/reporting-dashboard/application/dto/funnel-response.dto';
import { KpisResponseDto } from '@reports/reporting-dashboard/application/dto/kpis-response.dto';
import { StalePetDto } from '@reports/reporting-dashboard/application/dto/stale-pet.dto';
import { TimelinePointDto } from '@reports/reporting-dashboard/application/dto/timeline-point.dto';
import { TopPetDto } from '@reports/reporting-dashboard/application/dto/top-pet.dto';

/**
 * Payload agregado do `GET /reports/dashboard`. Reúne KPIs, séries
 * temporais, funil e listas operacionais em uma resposta única —
 * útil pro frontend fazer só uma chamada no load inicial da home.
 */
export class DashboardResponseDto {
  @ApiProperty({ type: KpisResponseDto })
  kpis!: KpisResponseDto;

  @ApiProperty({
    type: [TimelinePointDto],
    description: 'Série mensal de adoções (status=approved) nos últimos N meses',
  })
  adoptionsTimeline!: TimelinePointDto[];

  @ApiProperty({
    type: [TimelinePointDto],
    description: 'Série mensal de solicitações recebidas (qualquer status)',
  })
  requestsTimeline!: TimelinePointDto[];

  @ApiProperty({
    type: FunnelResponseDto,
    description: 'Funil de status nos últimos N meses',
  })
  funnel!: FunnelResponseDto;

  @ApiProperty({
    type: [TopPetDto],
    description: 'Pets mais solicitados (rank por count de solicitações)',
  })
  topPets!: TopPetDto[];

  @ApiProperty({
    type: [StalePetDto],
    description: 'Pets disponíveis sem solicitação no período configurado',
  })
  stalePets!: StalePetDto[];
}

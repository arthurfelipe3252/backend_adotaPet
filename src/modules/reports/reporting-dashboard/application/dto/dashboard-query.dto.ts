import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTOs de query string dos endpoints do dashboard.
 *
 * O ValidationPipe global (com `transform: true` + `enableImplicitConversion`)
 * cuida da conversão `string → number/Date`. Os decorators @Type explícitos
 * estão aqui como defesa em profundidade contra mudanças futuras na config.
 *
 * Limites superiores (months=60, limit=50, days=365) protegem contra abuso:
 * queries sem limite poderiam varrer toda a tabela.
 */

export class TimelineQueryDto {
  @ApiPropertyOptional({
    default: 12,
    minimum: 1,
    maximum: 60,
    description: 'Janela em meses retroativa a partir de hoje',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  months?: number = 12;
}

export class FunnelQueryDto {
  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Data inicial (ISO 8601). Default = 12 meses atrás',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    example: '2026-05-25T23:59:59.999Z',
    description: 'Data final (ISO 8601). Default = agora',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

export class TopPetsQueryDto {
  @ApiPropertyOptional({
    default: 5,
    minimum: 1,
    maximum: 50,
    description: 'Quantidade máxima de pets a retornar',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 5;
}

export class StalePetsQueryDto {
  @ApiPropertyOptional({
    default: 30,
    minimum: 1,
    maximum: 365,
    description: 'Threshold (dias sem solicitação) para considerar pet parado',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

export class DashboardQueryDto {
  @ApiPropertyOptional({
    default: 12,
    minimum: 1,
    maximum: 60,
    description: 'Janela em meses para os gráficos de timeline e funil',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  months?: number = 12;

  @ApiPropertyOptional({
    default: 5,
    minimum: 1,
    maximum: 50,
    description: 'Quantidade de pets na lista de top mais solicitados',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  topLimit?: number = 5;

  @ApiPropertyOptional({
    default: 30,
    minimum: 1,
    maximum: 365,
    description: 'Threshold (dias sem solicitação) para a lista de pets parados',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  staleDays?: number = 30;
}

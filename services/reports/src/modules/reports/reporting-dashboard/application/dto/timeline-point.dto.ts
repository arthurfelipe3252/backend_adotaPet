import { ApiProperty } from '@nestjs/swagger';

/**
 * Ponto único de uma série temporal mensal. O `count` pode ser 0 quando
 * o service preenche meses sem dados — o frontend recebe sempre N pontos
 * consecutivos para renderizar linha/área contínua.
 */
export class TimelinePointDto {
  @ApiProperty({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Primeiro dia do mês em UTC (00:00:00.000Z)',
  })
  monthStart!: Date;

  @ApiProperty({ example: 3, description: 'Contagem no mês' })
  count!: number;
}

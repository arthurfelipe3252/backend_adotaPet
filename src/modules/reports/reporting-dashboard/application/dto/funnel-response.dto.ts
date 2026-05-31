import { ApiProperty } from '@nestjs/swagger';

/**
 * Contagem por status na janela [from, to]. Frontend renderiza como funil
 * (received → in_analysis → approved) com `rejected` como vazamento.
 * Todos os campos são números >= 0 (nunca null).
 */
export class FunnelResponseDto {
  @ApiProperty({ example: 12, description: 'Solicitações em status=received' })
  received!: number;

  @ApiProperty({ example: 7, description: 'Solicitações em status=in_analysis' })
  inAnalysis!: number;

  @ApiProperty({ example: 4, description: 'Solicitações em status=approved' })
  approved!: number;

  @ApiProperty({ example: 2, description: 'Solicitações em status=rejected' })
  rejected!: number;
}

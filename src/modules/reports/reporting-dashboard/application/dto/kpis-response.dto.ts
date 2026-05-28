import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload dos KPIs do topo do dashboard. 9 números que respondem
 * "como está minha operação?" em uma única olhada.
 */
export class KpisResponseDto {
  @ApiProperty({ example: 12, description: 'Pets com status=disponivel' })
  petsDisponivel!: number;

  @ApiProperty({ example: 3, description: 'Pets com status=em_processo' })
  petsEmProcesso!: number;

  @ApiProperty({
    example: 87,
    description: 'Total de pets adotados (status=adotado) — all time',
  })
  petsAdotadoTotal!: number;

  @ApiProperty({
    example: 4,
    description:
      'Pets adotados no mês corrente (derivado de adoption_requests.updated_at ' +
      'WHERE status=approved e dentro do mês UTC atual)',
  })
  petsAdotadoMesAtual!: number;

  @ApiProperty({
    example: 7,
    description: 'Solicitações pendentes (status=received ou in_analysis)',
  })
  solicitacoesPendentes!: number;

  @ApiProperty({ example: 5, description: 'Conversas com is_active=true' })
  conversasAtivas!: number;

  @ApiProperty({
    example: 12,
    description: 'Mensagens não lidas enviadas pelo adotante (sender ≠ protetor)',
  })
  mensagensNaoLidas!: number;

  @ApiProperty({
    example: 32.5,
    nullable: true,
    description:
      'Percentual de solicitações aprovadas sobre o total. null quando ' +
      'não houver nenhuma solicitação (divisão por zero).',
  })
  taxaConversaoPct!: number | null;

  @ApiProperty({
    example: 14.3,
    nullable: true,
    description:
      'Média de dias entre criação da solicitação e aprovação. null quando ' +
      'nenhuma adoção foi concluída ainda.',
  })
  tempoMedioAdocaoDias!: number | null;
}

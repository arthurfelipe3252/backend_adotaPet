import { ApiProperty } from '@nestjs/swagger';

/**
 * Item da lista "top pets mais solicitados". O `totalRequests` inclui
 * solicitações em qualquer status (received/in_analysis/approved/rejected).
 */
export class TopPetDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  petId!: string;

  @ApiProperty({ example: 'Thor' })
  nome!: string;

  @ApiProperty({
    example: 'cao',
    enum: ['cao', 'gato', 'outro'],
  })
  especie!: string;

  @ApiProperty({
    example: 'medio',
    enum: ['pequeno', 'medio', 'grande'],
  })
  porte!: string;

  @ApiProperty({
    example: 'disponivel',
    enum: ['disponivel', 'em_processo', 'adotado'],
  })
  status!: string;

  @ApiProperty({
    example: 8,
    description:
      'Total de solicitações recebidas para este pet (qualquer status)',
  })
  totalRequests!: number;
}

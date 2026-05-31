import { ApiProperty } from '@nestjs/swagger';

/**
 * Item da lista "pets parados". Aparecem só pets com status=disponivel
 * que não receberam nenhuma solicitação no período configurado.
 */
export class StalePetDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Mel' })
  nome!: string;

  @ApiProperty({
    example: 'gato',
    enum: ['cao', 'gato', 'outro'],
  })
  especie!: string;

  @ApiProperty({
    example: 'pequeno',
    enum: ['pequeno', 'medio', 'grande'],
  })
  porte!: string;

  @ApiProperty({
    example: '2026-01-15T10:30:00.000Z',
    description: 'Quando o pet foi cadastrado',
  })
  createdAt!: Date;

  @ApiProperty({
    example: 130,
    description: 'Dias decorridos desde o cadastro até agora',
  })
  diasNoCatalogo!: number;
}

import {
  AdoptionPreTriageStatus,
  AdoptionRequestStatus,
} from '@adoption/adoption-requests/domain/models/adoption-request.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MatchQuestionnaireDto {
  @ApiProperty({
    enum: ['casa_com_quintal', 'casa_sem_quintal', 'apartamento'],
    example: 'apartamento',
  })
  @IsEnum(['casa_com_quintal', 'casa_sem_quintal', 'apartamento'])
  tipoMoradia!: 'casa_com_quintal' | 'casa_sem_quintal' | 'apartamento';

  @ApiProperty({
    example: 4,
    description: 'Horas disponiveis por dia para cuidados com o pet (0-24).',
  })
  @IsInt()
  @Min(0)
  @Max(24)
  horasDisponiveisDia!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  temExperiencia!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  temCriancas!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  temOutrosPets!: boolean;
}

export class CreateAdoptionRequestDto {
  @ApiProperty({ example: 'b3a6f6b2-7d63-4b02-9f0e-9b37f9499c7d' })
  @IsString()
  petId!: string;

  @ApiPropertyOptional({
    example: '7c2d2c9f-2b45-47a1-bf56-0b8d1293a9c0',
    description: 'ID do protetor/ONG responsavel pelo pet.',
  })
  @IsOptional()
  @IsString()
  protetorId?: string | null;

  @ApiProperty({ example: '3a6a3d3f-5b86-4f42-9f9d-6c2a2a8e3c2f' })
  @IsString()
  adopterId!: string;

  @ApiPropertyOptional({
    example: 'Tenho experiencia com animais e posso receber visitas.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mensagem?: string | null;

  @ApiPropertyOptional({ type: MatchQuestionnaireDto })
  @IsOptional()
  @IsObject({ message: 'questionario deve ser um objeto' })
  @IsNotEmptyObject(undefined, { message: 'questionario nao pode ser vazio' })
  @ValidateNested()
  @Type(() => MatchQuestionnaireDto)
  questionario?: MatchQuestionnaireDto | null;

  @ApiPropertyOptional({ example: 82, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  matchScore?: number | null;

  @ApiPropertyOptional({
    example: { tipoMoradia: 'apartamento', temExperiencia: true },
  })
  @IsOptional()
  @IsObject({ message: 'matchAnswers deve ser um objeto' })
  matchAnswers?: Record<string, string | number | boolean | null> | null;

  @ApiPropertyOptional({ enum: ['qualified', 'review', 'disqualified'] })
  @IsOptional()
  @IsEnum(['qualified', 'review', 'disqualified'])
  preTriageStatus?: AdoptionPreTriageStatus;
}

export class UpdateAdoptionRequestStatusDto {
  @ApiProperty({ enum: ['received', 'in_analysis', 'approved', 'rejected'] })
  @IsEnum(['received', 'in_analysis', 'approved', 'rejected'])
  status!: AdoptionRequestStatus;
}

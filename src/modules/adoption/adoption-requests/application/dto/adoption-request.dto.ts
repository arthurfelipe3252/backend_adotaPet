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
  IsUUID,
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
  // `adopterId` e `protetorId` NÃO estão no DTO:
  //  - adopterId é resolvido a partir do JWT (só adotante pode criar
  //    solicitação para si mesmo)
  //  - protetorId é derivado de `pets.protetor_id` no service
  // Aceitar do cliente permitiria spoofing de identidade.
  @ApiProperty({ example: 'b3a6f6b2-7d63-4b02-9f0e-9b37f9499c7d' })
  @IsUUID()
  petId!: string;

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

export class ProfileSummaryDto {
  @ApiProperty({ example: 'b3a6f6b2-7d63-4b02-9f0e-9b37f9499c7d' })
  id!: string;

  @ApiProperty({ example: 'João da Silva' })
  nome!: string;
}

export class AdoptionRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  petId!: string;

  @ApiProperty()
  adopterId!: string;

  @ApiProperty({ nullable: true })
  protetorId!: string | null;

  /**
   * Summary do adotante (id + nome) — populado pelo service via batch
   * lookup. Nulo se o adotante foi excluído.
   */
  @ApiProperty({ type: ProfileSummaryDto, nullable: true })
  adopter!: ProfileSummaryDto | null;

  /**
   * Summary do protetor/ong (id + nome). Nulo se a solicitação não tem
   * protetor associado ou se ele foi excluído.
   */
  @ApiProperty({ type: ProfileSummaryDto, nullable: true })
  protetor!: ProfileSummaryDto | null;

  @ApiProperty({ enum: ['received', 'in_analysis', 'approved', 'rejected'] })
  status!: AdoptionRequestStatus;

  @ApiProperty({ enum: ['qualified', 'review', 'disqualified'] })
  preTriageStatus!: AdoptionPreTriageStatus;

  @ApiProperty({ nullable: true })
  matchScore!: number | null;

  @ApiProperty({ nullable: true })
  matchAnswers!: Record<string, string | number | boolean | null> | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

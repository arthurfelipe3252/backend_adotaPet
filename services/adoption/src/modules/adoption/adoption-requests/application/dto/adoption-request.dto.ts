import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AdoptionRequest } from '@adoption/adoption-requests/domain/models/adoption-request.entity';
import type { AdoptionPreTriageStatus, AdoptionRequestStatus } from '@adoption/adoption-requests/domain/models/adoption-request.entity';

export class CreateAdoptionRequestDto {
  @ApiProperty() @IsUUID() petId!: string;
  @ApiProperty() @IsUUID() adopterId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() protetorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mensagem?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) matchScore?: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() matchAnswers?: Record<string, string | number | boolean | null>;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['qualified', 'review', 'disqualified']) preTriageStatus?: AdoptionPreTriageStatus;
}

export class UpdateAdoptionRequestStatusDto {
  @ApiProperty() @IsEnum(['received', 'in_analysis', 'approved', 'rejected']) status!: AdoptionRequestStatus;
}

export class AdoptionRequestResponseDto {
  id!: string;
  petId!: string;
  protetorId?: string | null;
  adopterId!: string;
  status!: AdoptionRequestStatus;
  preTriageStatus!: AdoptionPreTriageStatus;
  matchScore?: number | null;
  notes?: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromRequest(req: AdoptionRequest | null): AdoptionRequestResponseDto | null {
    if (!req) return null;
    const dto = new AdoptionRequestResponseDto();
    dto.id = req.id!;
    dto.petId = req.petId;
    dto.protetorId = req.protetorId;
    dto.adopterId = req.adopterId;
    dto.status = req.status;
    dto.preTriageStatus = req.preTriageStatus;
    dto.matchScore = req.matchScore;
    dto.notes = req.notes ?? null;
    dto.createdAt = req.createdAt!;
    dto.updatedAt = req.updatedAt!;
    return dto;
  }
}

import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  adoptionRequestId!: string;

  @IsOptional()
  @IsUUID()
  protetorId?: string;
}

export class UpdateConversationActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export interface ProfileSummary {
  id: string;
  nome: string;
}

export class ConversationResponseDto {
  id!: string;
  adoptionRequestId!: string;
  adopterId!: string;
  protetorId!: string;
  /**
   * Summary (id + nome) dos participantes — populados pelo service via
   * batch lookup. Nulos se o perfil foi excluído.
   */
  adopter!: ProfileSummary | null;
  protetor!: ProfileSummary | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

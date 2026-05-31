import { IsBoolean, IsUUID } from 'class-validator';

/**
 * adopterId/protetorId NÃO ficam no DTO de criação — são derivados da
 * `adoption_requests.adopter_id` / `adoption_requests.protetor_id` no
 * service. Aceitar do cliente permitiria criar conversa em nome de
 * outras pessoas.
 */
export class CreateConversationDto {
  @IsUUID()
  adoptionRequestId!: string;
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

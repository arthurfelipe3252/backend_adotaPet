import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  adoptionRequestId!: string;

  @IsUUID()
  adopterId!: string;

  @IsUUID()
  protetorId!: string;
}

export class UpdateConversationActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export class ConversationResponseDto {
  id!: string;
  adoptionRequestId!: string;
  adopterId!: string;
  protetorId!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ListConversationsQueryDto {
  @IsOptional()
  @IsUUID()
  adopterId?: string;

  @IsOptional()
  @IsUUID()
  protetorId?: string;
}

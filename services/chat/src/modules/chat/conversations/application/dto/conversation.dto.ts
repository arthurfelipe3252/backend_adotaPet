import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Conversation } from '@chat/conversations/domain/models/conversation.entity';

export class CreateConversationDto {
  @ApiProperty() @IsUUID() adoptionRequestId!: string;
  @ApiProperty() @IsUUID() adopterId!: string;
  @ApiProperty() @IsUUID() protetorId!: string;
}

export class UpdateConversationActiveDto {
  @ApiProperty() @IsBoolean() isActive!: boolean;
}

export class ListConversationsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() adopterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() protetorId?: string;
}

export class ConversationResponseDto {
  id!: string;
  adoptionRequestId!: string;
  adopterId!: string;
  protetorId!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromConversation(conv: Conversation | null): ConversationResponseDto | null {
    if (!conv) return null;
    const dto = new ConversationResponseDto();
    dto.id = conv.id ?? '';
    dto.adoptionRequestId = conv.adoptionRequestId;
    dto.adopterId = conv.adopterId;
    dto.protetorId = conv.protetorId;
    dto.isActive = conv.isActive;
    dto.createdAt = conv.createdAt ?? new Date();
    dto.updatedAt = conv.updatedAt ?? new Date();
    return dto;
  }
}

import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Message } from '@chat/conversations/domain/models/message.entity';

export class CreateMessageDto {
  @ApiProperty() @IsUUID() senderId!: string;
  @ApiProperty() @IsString() content!: string;
}

export class UpdateMessageReadDto {
  @ApiProperty() @IsBoolean() isRead!: boolean;
}

export class ListMessagesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) offset?: number;
}

export class MessageResponseDto {
  id!: string;
  conversationId!: string;
  senderId!: string;
  content!: string;
  isRead!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromMessage(msg: Message | null): MessageResponseDto | null {
    if (!msg) return null;
    const dto = new MessageResponseDto();
    dto.id = msg.id ?? '';
    dto.conversationId = msg.conversationId;
    dto.senderId = msg.senderId;
    dto.content = msg.content;
    dto.isRead = msg.isRead;
    dto.createdAt = msg.createdAt ?? new Date();
    dto.updatedAt = msg.updatedAt ?? new Date();
    return dto;
  }
}

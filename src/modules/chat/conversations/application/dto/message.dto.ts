import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  senderId!: string;

  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class UpdateMessageReadDto {
  @IsBoolean()
  isRead!: boolean;
}

export class ListMessagesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class MessageResponseDto {
  id!: string;
  conversationId!: string;
  senderId!: string;
  content!: string;
  isRead!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

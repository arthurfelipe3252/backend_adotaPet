import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MessageService } from '@chat/conversations/application/services/message.service';
import {
  CreateMessageDto,
  ListMessagesQueryDto,
  UpdateMessageReadDto,
} from '@chat/conversations/application/dto/message.dto';

@Controller('chat')
export class MessagesController {
  constructor(private readonly service: MessageService) {}

  @Post('conversations/:conversationId/messages')
  async create(
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.service.create(conversationId, dto);
  }

  @Get('conversations/:conversationId/messages')
  async findByConversation(
    @Param('conversationId') conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.service.findByConversation(conversationId, query);
  }

  @Patch('messages/:id/read')
  async updateReadStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMessageReadDto,
  ) {
    return this.service.updateReadStatus(id, dto);
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@shared/domain/enums/permission.enum';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { MessageService } from '@chat/conversations/application/services/message.service';
import { CreateMessageDto, ListMessagesQueryDto, UpdateMessageReadDto } from '@chat/conversations/application/dto/message.dto';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller('chat')
export class MessagesController {
  constructor(private readonly service: MessageService) {}

  @Post('conversations/:conversationId/messages')
  @RequirePermissions(Permission.MESSAGES_WRITE)
  create(@Param('conversationId') conversationId: string, @Body() dto: CreateMessageDto) {
    return this.service.create(conversationId, dto);
  }

  @Get('conversations/:conversationId/messages')
  @RequirePermissions(Permission.MESSAGES_READ)
  findByConversation(@Param('conversationId') conversationId: string, @Query() query: ListMessagesQueryDto) {
    return this.service.findByConversation(conversationId, query);
  }

  @Patch('messages/:id/read')
  @RequirePermissions(Permission.MESSAGES_WRITE)
  updateReadStatus(@Param('id') id: string, @Body() dto: UpdateMessageReadDto) {
    return this.service.updateReadStatus(id, dto);
  }
}

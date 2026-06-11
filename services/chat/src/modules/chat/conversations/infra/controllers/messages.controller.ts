import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessageService } from '@chat/conversations/application/services/message.service';
import {
  CreateMessageDto,
  ListMessagesQueryDto,
  UpdateMessageReadDto,
} from '@chat/conversations/application/dto/message.dto';
import { CurrentUser } from '@shared/infra/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { Permission } from '@shared/domain/enums/permission.enum';

interface JwtUser {
  sub: string;
  tipoUsuario: string;
  permissions: string[];
}

@ApiTags('Chat - Messages')
@ApiBearerAuth('access-token')
@Controller('chat')
export class MessagesController {
  constructor(private readonly service: MessageService) {}

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.MESSAGES_WRITE)
  async create(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.service.create(conversationId, user, dto);
  }

  @Get('conversations/:conversationId/messages')
  @RequirePermissions(Permission.MESSAGES_READ)
  async findByConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: JwtUser,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.service.findByConversation(conversationId, user, query);
  }

  @Patch('messages/:id/read')
  @RequirePermissions(Permission.MESSAGES_WRITE)
  async updateReadStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateMessageReadDto,
  ) {
    return this.service.updateReadStatus(id, user, dto);
  }
}

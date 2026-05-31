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
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';

/**
 * Endpoints de mensagens. Todos exigem JWT (guard global) e validam
 * participação na conversa. `senderId` é derivado do JWT — nunca do body.
 */
@ApiTags('Chat - Messages')
@ApiBearerAuth('access-token')
@Controller('chat')
export class MessagesController {
  constructor(private readonly service: MessageService) {}

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.service.create(
      conversationId,
      user.id,
      user.tipoUsuario,
      dto,
    );
  }

  @Get('conversations/:conversationId/messages')
  async findByConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.service.findByConversation(
      conversationId,
      user.id,
      user.tipoUsuario,
      query,
    );
  }

  @Patch('messages/:id/read')
  async updateReadStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMessageReadDto,
  ) {
    return this.service.updateReadStatus(
      id,
      user.id,
      user.tipoUsuario,
      dto,
    );
  }
}

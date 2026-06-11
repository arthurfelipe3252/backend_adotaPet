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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConversationService } from '@chat/conversations/application/services/conversation.service';
import {
  CreateConversationDto,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';

/**
 * Endpoints de conversas. Todos exigem JWT (guard global).
 *
 * Autorização:
 *  - POST: usuário precisa ser participante da adoption_request
 *  - GET: lista só conversas onde o usuário é participante
 *  - GET /:id, PATCH /:id/active, PATCH /:id/read: ownership (participante)
 */
@ApiTags('Chat - Conversations')
@ApiBearerAuth('access-token')
@Controller('chat/conversations')
export class ConversationsController {
  constructor(private readonly service: ConversationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.service.create(user.id, user.tipoUsuario, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id, user.tipoUsuario);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findById(id, user.id, user.tipoUsuario);
  }

  @Patch(':id/active')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateConversationActiveDto,
  ) {
    return this.service.updateStatus(id, user.id, user.tipoUsuario, dto);
  }

  /**
   * Marca todas as mensagens RECEBIDAS dessa conversa como lidas.
   * Mensagens enviadas pelo próprio usuário não são tocadas.
   * Retorna `{ markedAsRead: N }`.
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.markAllAsRead(id, user.id, user.tipoUsuario);
  }
}

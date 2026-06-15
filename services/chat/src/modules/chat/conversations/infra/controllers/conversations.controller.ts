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
import { CurrentUser } from '@shared/infra/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { Permission } from '@shared/domain/enums/permission.enum';

interface JwtUser {
  sub: string;
  tipoUsuario: string;
  permissions: string[];
}

@ApiTags('Chat - Conversations')
@ApiBearerAuth('access-token')
@Controller('chat/conversations')
export class ConversationsController {
  constructor(private readonly service: ConversationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.CONVERSATIONS_WRITE)
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateConversationDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @RequirePermissions(Permission.CONVERSATIONS_READ)
  async findAll(@CurrentUser() user: JwtUser) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.CONVERSATIONS_READ)
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.service.findById(id, user);
  }

  @Patch(':id/active')
  @RequirePermissions(Permission.CONVERSATIONS_WRITE)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateConversationActiveDto,
  ) {
    return this.service.updateStatus(id, user, dto);
  }

  @Patch(':id/read')
  @RequirePermissions(Permission.MESSAGES_WRITE)
  async markAllAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.markAllAsRead(id, user);
  }
}

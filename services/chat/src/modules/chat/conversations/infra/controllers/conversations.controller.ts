import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@shared/domain/enums/permission.enum';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { HateoasItem, HateoasList } from '@shared/infra/hateoas';
import { ConversationService } from '@chat/conversations/application/services/conversation.service';
import { ConversationResponseDto, CreateConversationDto, ListConversationsQueryDto, UpdateConversationActiveDto } from '@chat/conversations/application/dto/conversation.dto';

@ApiTags('Conversations')
@ApiBearerAuth('access-token')
@Controller('chat/conversations')
export class ConversationsController {
  constructor(private readonly service: ConversationService) {}

  @Get()
  @RequirePermissions(Permission.CONVERSATIONS_READ)
  @HateoasList<ConversationResponseDto>({
    basePath: '/v1/chat/conversations',
    itemLinks: (item) => ({
      self: { href: `/v1/chat/conversations/${item.id}`, method: 'GET' },
      messages: { href: `/v1/chat/conversations/${item.id}/messages`, method: 'GET' },
    }),
  })
  findAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.service.listPaginated({ page, limit });
  }

  @Get(':id')
  @RequirePermissions(Permission.CONVERSATIONS_READ)
  @HateoasItem<ConversationResponseDto>({
    basePath: '/v1/chat/conversations',
    itemLinks: (item) => ({
      self: { href: `/v1/chat/conversations/${item.id}`, method: 'GET' },
      messages: { href: `/v1/chat/conversations/${item.id}/messages`, method: 'GET' },
      list: { href: '/v1/chat/conversations', method: 'GET' },
    }),
  })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions(Permission.CONVERSATIONS_WRITE)
  create(@Body() dto: CreateConversationDto) {
    return this.service.create(dto);
  }

  @Patch(':id/active')
  @RequirePermissions(Permission.CONVERSATIONS_WRITE)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateConversationActiveDto) {
    return this.service.updateStatus(id, dto);
  }
}

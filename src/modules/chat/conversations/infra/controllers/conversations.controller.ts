import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ConversationService } from '@chat/conversations/application/services/conversation.service';
import {
  CreateConversationDto,
  ListConversationsQueryDto,
  UpdateConversationActiveDto,
} from '@chat/conversations/application/dto/conversation.dto';

@Controller('chat/conversations')
export class ConversationsController {
  constructor(private readonly service: ConversationService) {}

  @Post()
  async create(@Body() dto: CreateConversationDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() query: ListConversationsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/active')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateConversationActiveDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}

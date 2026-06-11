import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdoptionRequestService } from '@adoption/adoption-requests/application/services/adoption-request.service';
import {
  CreateAdoptionRequestDto,
  UpdateAdoptionRequestStatusDto,
} from '@adoption/adoption-requests/application/dto/adoption-request.dto';
import { CurrentUser } from '@shared/infra/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { Permission } from '@shared/domain/enums/permission.enum';

interface JwtUser {
  sub: string;
  tipoUsuario: string;
  permissions: string[];
}

@ApiTags('Adoptions')
@ApiBearerAuth('access-token')
@Controller('adoptions')
export class AdoptionRequestsController {
  constructor(private readonly service: AdoptionRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.ADOPTION_REQUESTS_WRITE)
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateAdoptionRequestDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @RequirePermissions(Permission.ADOPTION_REQUESTS_READ)
  async findAll(@CurrentUser() user: JwtUser) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.ADOPTION_REQUESTS_READ)
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.service.findById(id, user);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.ADOPTION_REQUESTS_WRITE)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateAdoptionRequestStatusDto,
  ) {
    return this.service.updateStatus(id, user, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.ADOPTION_REQUESTS_DELETE)
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    await this.service.delete(id, user);
  }
}

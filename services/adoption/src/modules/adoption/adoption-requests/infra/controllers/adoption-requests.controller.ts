import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@shared/domain/enums/permission.enum';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { HateoasItem, HateoasList } from '@shared/infra/hateoas';
import { AdoptionRequestService } from '@adoption/adoption-requests/application/services/adoption-request.service';
import {
  AdoptionRequestResponseDto,
  CreateAdoptionRequestDto,
  UpdateAdoptionRequestStatusDto,
} from '@adoption/adoption-requests/application/dto/adoption-request.dto';

@ApiTags('Adoption Requests')
@ApiBearerAuth('access-token')
@Controller('adoptions')
export class AdoptionRequestsController {
  constructor(private readonly service: AdoptionRequestService) {}

  @Get()
  @RequirePermissions(Permission.ADOPTION_REQUESTS_READ)
  @HateoasList<AdoptionRequestResponseDto>({
    basePath: '/v1/adoptions',
    itemLinks: (item) => ({
      self: { href: `/v1/adoptions/${item.id}`, method: 'GET' },
      updateStatus: { href: `/v1/adoptions/${item.id}/status`, method: 'PATCH' },
    }),
  })
  findAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.service.listPaginated({ page, limit });
  }

  @Get(':id')
  @RequirePermissions(Permission.ADOPTION_REQUESTS_READ)
  @HateoasItem<AdoptionRequestResponseDto>({
    basePath: '/v1/adoptions',
    itemLinks: (item) => ({
      self: { href: `/v1/adoptions/${item.id}`, method: 'GET' },
      list: { href: '/v1/adoptions', method: 'GET' },
    }),
  })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions(Permission.ADOPTION_REQUESTS_WRITE)
  create(@Body() dto: CreateAdoptionRequestDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.ADOPTION_REQUESTS_WRITE)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAdoptionRequestStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.ADOPTION_REQUESTS_WRITE)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

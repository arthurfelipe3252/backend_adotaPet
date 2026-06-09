import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@shared/domain/enums/permission.enum';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { Public } from '@shared/infra/decorators/public.decorator';
import { HateoasItem, HateoasList } from '@shared/infra/hateoas';
import { ProtetorOngService } from '@identity/protetores-ongs/application/services/protetor-ong.service';
import {
  CreateProtetorOngDto,
  ProtetorOngResponseDto,
  UpdateProtetorOngDto,
} from '@identity/protetores-ongs/application/dto/protetor-ong.dto';

@ApiTags('Protetores / ONGs')
@ApiBearerAuth('access-token')
@Controller('protetores')
export class ProtetoresOngsController {
  constructor(private readonly service: ProtetorOngService) {}

  @Get()
  @RequirePermissions(Permission.PROTETORES_READ)
  @HateoasList<ProtetorOngResponseDto>({
    basePath: '/v1/protetores',
    itemLinks: (item) => ({
      self: { href: `/v1/protetores/${item.id}`, method: 'GET' },
      update: { href: `/v1/protetores/${item.id}`, method: 'PUT' },
    }),
  })
  findAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.service.listPaginated({ page, limit });
  }

  @Get(':id')
  @RequirePermissions(Permission.PROTETORES_READ)
  @HateoasItem<ProtetorOngResponseDto>({
    basePath: '/v1/protetores',
    itemLinks: (item) => ({
      self: { href: `/v1/protetores/${item.id}`, method: 'GET' },
      update: { href: `/v1/protetores/${item.id}`, method: 'PUT' },
      list: { href: '/v1/protetores', method: 'GET' },
    }),
  })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Public()
  create(@Body() dto: CreateProtetorOngDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.PROTETORES_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateProtetorOngDto) {
    return this.service.update(id, dto);
  }
}

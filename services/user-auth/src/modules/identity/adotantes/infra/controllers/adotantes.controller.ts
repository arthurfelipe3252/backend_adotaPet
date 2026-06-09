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
import { AdotanteService } from '@identity/adotantes/application/services/adotante.service';
import {
  AdotanteResponseDto,
  CreateAdotanteDto,
  UpdateAdotanteDto,
} from '@identity/adotantes/application/dto/adotante.dto';

@ApiTags('Adotantes')
@ApiBearerAuth('access-token')
@Controller('adotantes')
export class AdotantesController {
  constructor(private readonly adotanteService: AdotanteService) {}

  @Get()
  @RequirePermissions(Permission.ADOTANTES_READ)
  @HateoasList<AdotanteResponseDto>({
    basePath: '/v1/adotantes',
    itemLinks: (item) => ({
      self: { href: `/v1/adotantes/${item.id}`, method: 'GET' },
      update: { href: `/v1/adotantes/${item.id}`, method: 'PUT' },
    }),
  })
  findAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.adotanteService.listPaginated({ page, limit });
  }

  @Get(':id')
  @RequirePermissions(Permission.ADOTANTES_READ)
  @HateoasItem<AdotanteResponseDto>({
    basePath: '/v1/adotantes',
    itemLinks: (item) => ({
      self: { href: `/v1/adotantes/${item.id}`, method: 'GET' },
      update: { href: `/v1/adotantes/${item.id}`, method: 'PUT' },
      list: { href: '/v1/adotantes', method: 'GET' },
    }),
  })
  findById(@Param('id') id: string) {
    return this.adotanteService.findById(id);
  }

  @Post()
  @Public()
  create(@Body() dto: CreateAdotanteDto) {
    return this.adotanteService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.ADOTANTES_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateAdotanteDto) {
    return this.adotanteService.update(id, dto);
  }
}

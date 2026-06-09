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
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@shared/domain/enums/permission.enum';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { HateoasItem, HateoasList } from '@shared/infra/hateoas';
import { PetService } from '@catalog/pets/application/services/pet.service';
import { CreatePetDto, PetResponseDto, UpdatePetDto } from '@catalog/pets/application/dto/pet.dto';
import type { Especie, Porte, PetStatus } from '@catalog/pets/domain/models/pet.entity';

@ApiTags('Pets')
@ApiBearerAuth('access-token')
@Controller('pets')
export class PetsController {
  constructor(private readonly petService: PetService) {}

  @Get()
  @RequirePermissions(Permission.PETS_READ)
  @HateoasList<PetResponseDto>({
    basePath: '/v1/pets',
    itemLinks: (item) => ({
      self: { href: `/v1/pets/${item.id}`, method: 'GET' },
      update: { href: `/v1/pets/${item.id}`, method: 'PUT' },
      delete: { href: `/v1/pets/${item.id}`, method: 'DELETE' },
    }),
  })
  findAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('especie') especie?: Especie,
    @Query('porte') porte?: Porte,
    @Query('status') status?: PetStatus,
    @Query('castrado') castrado?: string,
    @Query('protetorId') protetorId?: string,
  ) {
    return this.petService.listPaginated(
      { page, limit },
      {
        especie,
        porte,
        status,
        protetorId,
        castrado: castrado === 'true' ? true : castrado === 'false' ? false : undefined,
      },
    );
  }

  @Get(':id')
  @RequirePermissions(Permission.PETS_READ)
  @HateoasItem<PetResponseDto>({
    basePath: '/v1/pets',
    itemLinks: (item) => ({
      self: { href: `/v1/pets/${item.id}`, method: 'GET' },
      update: { href: `/v1/pets/${item.id}`, method: 'PUT' },
      delete: { href: `/v1/pets/${item.id}`, method: 'DELETE' },
      list: { href: '/v1/pets', method: 'GET' },
    }),
  })
  findById(@Param('id') id: string) {
    return this.petService.findById(id);
  }

  @Post()
  @RequirePermissions(Permission.PETS_WRITE)
  create(@Body() dto: CreatePetDto) {
    return this.petService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.PETS_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.petService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.PETS_DELETE)
  delete(@Param('id') id: string) {
    return this.petService.delete(id);
  }
}

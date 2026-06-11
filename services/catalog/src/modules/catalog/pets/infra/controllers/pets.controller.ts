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
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/infra/decorators/require-permissions.decorator';
import { Permission } from '@shared/domain/enums/permission.enum';
import { HateoasList, HateoasItem } from '@shared/infra/hateoas';
import { PetService } from '../../application/services/pet.service';
import { CreatePetDto, UpdatePetDto } from '../../application/dto/pet.dto';
import type { PetResponseDto } from '../../application/dto/pet.dto';
import type { PetFilters } from '../../domain/repositories/pet-repository.interface';
import type { Especie, Porte, PetStatus } from '../../domain/models/pet.entity';

interface JwtUser {
  sub: string;
  permissions: string[];
}

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
      update: { href: `/v1/pets/${item.id}`, method: 'PATCH' },
      delete: { href: `/v1/pets/${item.id}`, method: 'DELETE' },
    }),
  })
  findAll(
    @Query('especie') especie?: Especie,
    @Query('porte') porte?: Porte,
    @Query('status') status?: PetStatus,
    @Query('castrado') castrado?: string,
    @Query('protetorId') protetorId?: string,
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) _page?: number,
    @Query('_size', new DefaultValuePipe(10), ParseIntPipe) _size?: number,
  ) {
    const filters: PetFilters = {
      especie,
      porte,
      status,
      protetorId,
      castrado:
        castrado === 'true' ? true : castrado === 'false' ? false : undefined,
    };
    return this.petService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(Permission.PETS_READ)
  @HateoasItem<PetResponseDto>({
    basePath: '/v1/pets',
    itemLinks: (item) => ({
      self: { href: `/v1/pets/${item.id}`, method: 'GET' },
      update: { href: `/v1/pets/${item.id}`, method: 'PATCH' },
      delete: { href: `/v1/pets/${item.id}`, method: 'DELETE' },
      list: { href: '/v1/pets', method: 'GET' },
    }),
  })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.petService.findById(id);
  }

  @Get('/protetor/:protetorId')
  @RequirePermissions(Permission.PETS_READ)
  findByProtetor(@Param('protetorId', ParseUUIDPipe) protetorId: string) {
    return this.petService.findByProtetor(protetorId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.PETS_WRITE)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePetDto) {
    return this.petService.create(user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.PETS_WRITE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.PETS_DELETE)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.petService.delete(id, user.sub);
  }
}

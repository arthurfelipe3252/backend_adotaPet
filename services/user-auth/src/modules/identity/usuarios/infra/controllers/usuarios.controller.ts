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
import { Public } from '@shared/infra/decorators/public.decorator';
import { CurrentUser } from '@shared/infra/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@shared/infra/decorators/current-user.decorator';
import { HateoasItem, HateoasList } from '@shared/infra/hateoas';
import { UsuarioService } from '@identity/usuarios/application/services/usuario.service';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UsuarioResponseDto,
} from '@identity/usuarios/application/dto/usuario.dto';

@ApiTags('Usuários')
@ApiBearerAuth('access-token')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  @RequirePermissions(Permission.USERS_READ)
  @HateoasList<UsuarioResponseDto>({
    basePath: '/v1/usuarios',
    itemLinks: (item) => ({
      self: { href: `/v1/usuarios/${item.id}`, method: 'GET' },
      update: { href: `/v1/usuarios/${item.id}`, method: 'PUT' },
      delete: { href: `/v1/usuarios/${item.id}`, method: 'DELETE' },
    }),
  })
  findAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usuarioService.listPaginated({ page, limit });
  }

  @Get(':id')
  @RequirePermissions(Permission.USERS_READ)
  @HateoasItem<UsuarioResponseDto>({
    basePath: '/v1/usuarios',
    itemLinks: (item) => ({
      self: { href: `/v1/usuarios/${item.id}`, method: 'GET' },
      update: { href: `/v1/usuarios/${item.id}`, method: 'PUT' },
      delete: { href: `/v1/usuarios/${item.id}`, method: 'DELETE' },
      list: { href: '/v1/usuarios', method: 'GET' },
    }),
  })
  findById(@Param('id') id: string) {
    return this.usuarioService.findById(id);
  }

  @Post()
  @Public()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.USERS_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usuarioService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.USERS_WRITE)
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usuarioService.deactivate(id, user);
  }
}

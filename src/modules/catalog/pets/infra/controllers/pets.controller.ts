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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import { PetService } from '../../application/services/pet.service';
import type { CreatePetDto, UpdatePetDto } from '../../application/dto/pet.dto';
import type { PetFilters } from '../../domain/repositories/pet-repository.interface';
import type { Especie, Porte, PetStatus } from '../../domain/models/pet.entity';

/**
 * Endpoints de pets. Todos exigem JWT (guard global no AppModule).
 *
 * Autorização:
 *  - GET (listagem, detalhe, by-protetor): qualquer autenticado pode ver
 *    o catálogo
 *  - POST: o `protetorId` do pet é resolvido a partir do JWT — o DTO
 *    não aceita esse campo. Tipo precisa ser protetor/ong.
 *  - PATCH/DELETE: apenas o protetor dono do pet pode alterar/remover
 *    (checado no service via `findOwnedOrFail`).
 */
@ApiTags('Pets')
@ApiBearerAuth('access-token')
@Controller('pets')
export class PetsController {
  constructor(private readonly petService: PetService) {}

  // GET /pets?especie=cao&porte=pequeno&status=disponivel&castrado=true
  @Get()
  findAll(
    @Query('especie') especie?: Especie,
    @Query('porte') porte?: Porte,
    @Query('status') status?: PetStatus,
    @Query('castrado') castrado?: string,
    @Query('protetorId') protetorId?: string,
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

  // GET /pets/:id
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.petService.findById(id);
  }

  // GET /pets/protetor/:protetorId  (catálogo do protetor)
  @Get('/protetor/:protetorId')
  findByProtetor(@Param('protetorId', ParseUUIDPipe) protetorId: string) {
    return this.petService.findByProtetor(protetorId);
  }

  // POST /pets — apenas protetor/ong; protetorId vem do JWT
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePetDto) {
    return this.petService.create(user.id, user.tipoUsuario, dto);
  }

  // PATCH /pets/:id — apenas o protetor dono
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petService.update(id, user.id, user.tipoUsuario, dto);
  }

  // DELETE /pets/:id — apenas o protetor dono
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.petService.delete(id, user.id, user.tipoUsuario);
  }
}

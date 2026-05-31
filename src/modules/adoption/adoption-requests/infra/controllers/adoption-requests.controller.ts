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
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';

/**
 * Endpoints de solicitações de adoção. Todos exigem JWT (guard global).
 *
 * Autorização:
 *  - POST: adopterId vem do JWT; protetorId é derivado de pets.protetor_id
 *  - GET: adotante vê só as próprias; protetor/ong vê só as direcionadas
 *    ao seu protetorId
 *  - PATCH status: apenas o protetor/ong dono do pet
 *  - DELETE: apenas o adotante criador
 */
@ApiTags('Adoptions')
@ApiBearerAuth('access-token')
@Controller('adoptions')
export class AdoptionRequestsController {
  constructor(private readonly service: AdoptionRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdoptionRequestDto,
  ) {
    return this.service.create(user.id, user.tipoUsuario, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id, user.tipoUsuario);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findById(id, user.id, user.tipoUsuario);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAdoptionRequestStatusDto,
  ) {
    return this.service.updateStatus(id, user.id, user.tipoUsuario, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.service.delete(id, user.id, user.tipoUsuario);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PetService } from "../../application/services/pet.service";
import type { CreatePetDto, UpdatePetDto } from "../../application/dto/pet.dto";
import type { PetFilters } from "../../domain/repositories/pet-repository.interface";
import type { Especie, Porte, PetStatus } from "../../domain/models/pet.entity";

@Controller("pets")
export class PetsController {
  constructor(private readonly petService: PetService) {}

  // GET /pets?especie=cao&porte=pequeno&status=disponivel&castrado=true
  @Get()
  findAll(
    @Query("especie") especie?: Especie,
    @Query("porte") porte?: Porte,
    @Query("status") status?: PetStatus,
    @Query("castrado") castrado?: string,
    @Query("protetorId") protetorId?: string,
  ) {
    const filters: PetFilters = {
      especie,
      porte,
      status,
      protetorId,
      castrado:
        castrado === "true" ? true : castrado === "false" ? false : undefined,
    };

    return this.petService.findAll(filters);
  }

  // GET /pets/:id
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.petService.findById(id);
  }

  // GET /protetor/:protetorId/pets  (painel da ONG)
  @Get("/protetor/:protetorId")
  findByProtetor(@Param("protetorId") protetorId: string) {
    return this.petService.findByProtetor(protetorId);
  }

  // POST /pets
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePetDto) {
    return this.petService.create(dto);
  }

  // PATCH /pets/:id
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePetDto) {
    return this.petService.update(id, dto);
  }

  // DELETE /pets/:id
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id") id: string) {
    return this.petService.delete(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AdoptionRequestService } from "@adoption/adoption-requests/application/services/adoption-request.service";
import {
  CreateAdoptionRequestDto,
  UpdateAdoptionRequestStatusDto,
} from "@adoption/adoption-requests/application/dto/adoption-request.dto";

@Controller("adoptions")
export class AdoptionRequestsController {
  constructor(private readonly service: AdoptionRequestService) {}

  @Post()
  async create(@Body() dto: CreateAdoptionRequestDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAdoptionRequestStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.service.delete(id);
    return { ok: true };
  }
}

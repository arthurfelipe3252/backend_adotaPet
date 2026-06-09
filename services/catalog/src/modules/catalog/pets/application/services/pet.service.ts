import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Pet } from '@catalog/pets/domain/models/pet.entity';
import type { PetFilters, PetRepository } from '@catalog/pets/domain/repositories/pet-repository.interface';
import { PET_REPOSITORY } from '@catalog/pets/domain/repositories/pet-repository.interface';
import { PetResponseDto, type CreatePetDto, type UpdatePetDto } from '../dto/pet.dto';
import { PetMessagingService } from './pet-messaging.service';

@Injectable()
export class PetService {
  constructor(
    @Inject(PET_REPOSITORY)
    private readonly petRepository: PetRepository,
    private readonly messagingService: PetMessagingService,
  ) {}

  async create(dto: CreatePetDto): Promise<PetResponseDto> {
    const pet = Pet.create(dto);
    const created = await this.petRepository.create(pet);
    const response = PetResponseDto.fromPet(created)!;
    await this.messagingService.publishPetCreated(response);
    return response;
  }

  async findAll(filters?: PetFilters): Promise<PetResponseDto[]> {
    const pets = await this.petRepository.findAll(filters);
    return pets.map((p) => PetResponseDto.fromPet(p)!);
  }

  async listPaginated(
    params: PaginationParams,
    filters?: PetFilters,
  ): Promise<{ rows: PetResponseDto[]; total: number }> {
    const result = await this.petRepository.findAllPaginated(params, filters);
    return { rows: result.rows.map((p) => PetResponseDto.fromPet(p)!), total: result.total };
  }

  async findById(id: string): Promise<PetResponseDto> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    return PetResponseDto.fromPet(pet)!;
  }

  async update(id: string, dto: UpdatePetDto): Promise<PetResponseDto> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);

    if (dto.nome !== undefined) pet.withNome(dto.nome);
    if (dto.especie !== undefined) pet.withEspecie(dto.especie);
    if (dto.raca !== undefined) pet.withRaca(dto.raca ?? null);
    if (dto.porte !== undefined) pet.withPorte(dto.porte);
    if (dto.sexo !== undefined) pet.withSexo(dto.sexo);
    if (dto.idadeMeses !== undefined) pet.withIdadeMeses(dto.idadeMeses);
    if (dto.castrado !== undefined) pet.withCastrado(dto.castrado);
    if (dto.vacinado !== undefined) pet.withVacinado(dto.vacinado);
    if (dto.descricao !== undefined) pet.withDescricao(dto.descricao ?? null);
    if (dto.temperamento !== undefined) pet.withTemperamento(dto.temperamento ?? null);
    if (dto.status !== undefined) pet.withStatus(dto.status);
    if (dto.fotosUrls !== undefined) pet.withFotosUrls(dto.fotosUrls ?? null);

    await this.petRepository.update(pet);
    const response = PetResponseDto.fromPet(pet)!;
    await this.messagingService.publishPetUpdated(response);
    return response;
  }

  async delete(id: string): Promise<void> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    await this.petRepository.delete(id);
    await this.messagingService.publishPetDeleted(id);
  }

  async findByProtetor(protetorId: string): Promise<PetResponseDto[]> {
    const pets = await this.petRepository.findByProtetor(protetorId);
    return pets.map((p) => PetResponseDto.fromPet(p)!);
  }
}

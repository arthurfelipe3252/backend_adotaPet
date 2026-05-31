import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pet } from '../../domain/models/pet.entity';
import type {
  PetFilters,
  PetRepository,
} from '../../domain/repositories/pet-repository.interface';
import { PET_REPOSITORY } from '../../domain/repositories/pet-repository.interface';
import type {
  CreatePetDto,
  UpdatePetDto,
  PetResponseDto,
} from '../dto/pet.dto';

@Injectable()
export class PetService {
  constructor(
    @Inject(PET_REPOSITORY)
    private readonly petRepository: PetRepository,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private toResponse(pet: Pet): PetResponseDto {
    return {
      id: pet.id!,
      protetorId: pet.protetorId,
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca ?? null,
      porte: pet.porte,
      sexo: pet.sexo,
      idadeMeses: pet.idadeMeses,
      castrado: pet.castrado,
      vacinado: pet.vacinado,
      descricao: pet.descricao ?? null,
      temperamento: pet.temperamento ?? null,
      status: pet.status,
      fotosUrls: pet.fotosUrls ?? [],
      createdAt: pet.createdAt!,
      updatedAt: pet.updatedAt!,
    };
  }

  // ── Casos de uso ───────────────────────────────────────────────────────────

  async create(dto: CreatePetDto): Promise<PetResponseDto> {
    const pet = Pet.create(dto);
    const created = await this.petRepository.create(pet);
    return this.toResponse(created);
  }

  async findAll(filters?: PetFilters): Promise<PetResponseDto[]> {
    const pets = await this.petRepository.findAll(filters);
    return pets.map((p) => this.toResponse(p));
  }

  async findById(id: string): Promise<PetResponseDto> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    return this.toResponse(pet);
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
    if (dto.temperamento !== undefined)
      pet.withTemperamento(dto.temperamento ?? null);
    if (dto.status !== undefined) pet.withStatus(dto.status);
    if (dto.fotosUrls !== undefined) pet.withFotosUrls(dto.fotosUrls ?? null);

    await this.petRepository.update(pet);
    return this.toResponse(pet);
  }

  async delete(id: string): Promise<void> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    await this.petRepository.delete(id);
  }

  async findByProtetor(protetorId: string): Promise<PetResponseDto[]> {
    const pets = await this.petRepository.findByProtetor(protetorId);
    return pets.map((p) => this.toResponse(p));
  }
}

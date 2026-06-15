import {
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Pet } from '../../domain/models/pet.entity';
import type {
  PetFilters,
  PetRepository,
} from '../../domain/repositories/pet-repository.interface';
import { PET_REPOSITORY } from '../../domain/repositories/pet-repository.interface';
import { PetMessagingService } from './pet-messaging.service';
import type { CreatePetDto, UpdatePetDto, PetResponseDto, ProfileSummary } from '../dto/pet.dto';
import type { CatalogPetPayload } from '@shared/contracts/events/catalog-events.enum';
import { PROFILE_REPOSITORY } from '@catalog/profiles/domain/repositories/profile-repository.interface';
import type {
  ProfileRepository,
  ProfileView,
} from '@catalog/profiles/domain/repositories/profile-repository.interface';

@Injectable()
export class PetService {
  constructor(
    @Inject(PET_REPOSITORY)
    private readonly petRepository: PetRepository,
    private readonly petMessagingService: PetMessagingService,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
  ) {}

  /** Converte o perfil replicado no resumo `{id, nome}` exposto na resposta. */
  private toSummary(p: ProfileView | null | undefined): ProfileSummary | null {
    return p ? { id: p.id, nome: p.nome } : null;
  }

  /**
   * Projeta a entidade Pet no payload completo do evento (contrato compartilhado).
   * Usado em create/update pra alimentar as réplicas dos consumidores (reports, match).
   */
  private toPetEvent(pet: Pet): CatalogPetPayload {
    const now = new Date();
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
      temperamento: pet.temperamento ?? null,
      status: pet.status,
      fotosUrls: pet.fotosUrls ?? [],
      createdAt: (pet.createdAt ?? now).toISOString(),
      updatedAt: (pet.updatedAt ?? now).toISOString(),
    };
  }

  private mapToResponse(
    pet: Pet,
    protetor: ProfileSummary | null = null,
  ): PetResponseDto {
    return {
      id: pet.id!,
      protetorId: pet.protetorId,
      protetor,
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

  async create(userId: string, dto: CreatePetDto): Promise<PetResponseDto> {
    const pet = Pet.create({ ...dto, protetorId: userId });
    const created = await this.petRepository.create(pet);
    await this.petMessagingService.publishPetCreated(this.toPetEvent(created));
    const protetor = await this.profileRepository.findById(created.protetorId);
    return this.mapToResponse(created, this.toSummary(protetor));
  }

  async findAll(
    filters?: PetFilters,
  ): Promise<{ rows: PetResponseDto[]; total: number }> {
    const { rows, total } = await this.petRepository.findAll(filters);
    const profiles = await this.profileRepository.findByIds([
      ...new Set(rows.map((p) => p.protetorId)),
    ]);
    return {
      rows: rows.map((p) => this.mapToResponse(p, this.toSummary(profiles.get(p.protetorId)))),
      total,
    };
  }

  async findById(id: string): Promise<PetResponseDto> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    const protetor = await this.profileRepository.findById(pet.protetorId);
    return this.mapToResponse(pet, this.toSummary(protetor));
  }

  async findByProtetor(protetorId: string): Promise<PetResponseDto[]> {
    const pets = await this.petRepository.findByProtetor(protetorId);
    const protetor = this.toSummary(await this.profileRepository.findById(protetorId));
    return pets.map((p) => this.mapToResponse(p, protetor));
  }

  async update(id: string, userId: string, dto: UpdatePetDto): Promise<PetResponseDto> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    if (pet.protetorId !== userId) throw new ForbiddenException('Pet pertence a outro protetor');

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
    await this.petMessagingService.publishPetUpdated(this.toPetEvent(pet));
    const protetor = await this.profileRepository.findById(pet.protetorId);
    return this.mapToResponse(pet, this.toSummary(protetor));
  }

  async delete(id: string, userId: string): Promise<void> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    if (pet.protetorId !== userId) throw new ForbiddenException('Pet pertence a outro protetor');
    await this.petRepository.delete(id);
    await this.petMessagingService.publishPetDeleted(id);
  }
}

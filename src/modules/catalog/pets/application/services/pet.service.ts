import {
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  PROTETOR_ONG_REPOSITORY,
  type ProtetorOngRepository,
} from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { resolveProtetorIdOrFail } from '@identity/usuarios/application/helpers/resolve-profile-id.helper';
import {
  buildProtetorSummaryMap,
  fetchProtetorSummary,
} from '@identity/usuarios/application/helpers/profile-summary.helper';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
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
  ProfileSummary,
} from '../dto/pet.dto';

@Injectable()
export class PetService {
  constructor(
    @Inject(PET_REPOSITORY)
    private readonly petRepository: PetRepository,
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorRepository: ProtetorOngRepository,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private mapToResponse(
    pet: Pet,
    protetor: ProfileSummary | null,
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

  private async toResponseSingle(pet: Pet): Promise<PetResponseDto> {
    const protetor = await fetchProtetorSummary(
      this.protetorRepository,
      pet.protetorId,
    );
    return this.mapToResponse(pet, protetor);
  }

  private async toResponseBatch(pets: Pet[]): Promise<PetResponseDto[]> {
    const protetores = await buildProtetorSummaryMap(
      this.protetorRepository,
      pets.map((p) => p.protetorId),
    );
    return pets.map((p) =>
      this.mapToResponse(p, protetores.get(p.protetorId) ?? null),
    );
  }

  /**
   * Garante que o pet existe e que o protetor autenticado é dono dele.
   * Centraliza a checagem porque update/delete repetem a mesma lógica.
   */
  private async findOwnedOrFail(
    petId: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<{ pet: Pet; protetorId: string }> {
    const protetorId = await resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
    const pet = await this.petRepository.findById(petId);
    if (!pet) throw new NotFoundException(`Pet ${petId} não encontrado.`);
    if (pet.protetorId !== protetorId) {
      throw new ForbiddenException('Pet pertence a outro protetor');
    }
    return { pet, protetorId };
  }

  // ── Casos de uso ───────────────────────────────────────────────────────────

  /**
   * Cria pet. `protetorId` é SEMPRE derivado do JWT — o DTO não tem
   * esse campo (ver dto). Só protetor/ong pode criar.
   */
  async create(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: CreatePetDto,
  ): Promise<PetResponseDto> {
    const protetorId = await resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
    const pet = Pet.create({ ...dto, protetorId });
    const created = await this.petRepository.create(pet);
    return this.toResponseSingle(created);
  }

  async findAll(filters?: PetFilters): Promise<PetResponseDto[]> {
    const pets = await this.petRepository.findAll(filters);
    return this.toResponseBatch(pets);
  }

  async findById(id: string): Promise<PetResponseDto> {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    return this.toResponseSingle(pet);
  }

  async findByProtetor(protetorId: string): Promise<PetResponseDto[]> {
    const pets = await this.petRepository.findByProtetor(protetorId);
    return this.toResponseBatch(pets);
  }

  /**
   * Atualiza pet. Apenas o protetor dono pode alterar.
   */
  async update(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: UpdatePetDto,
  ): Promise<PetResponseDto> {
    const { pet } = await this.findOwnedOrFail(id, usuarioId, tipoUsuario);

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
    return this.toResponseSingle(pet);
  }

  /**
   * Deleta pet. Apenas o protetor dono pode.
   */
  async delete(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<void> {
    await this.findOwnedOrFail(id, usuarioId, tipoUsuario);
    await this.petRepository.delete(id);
  }
}

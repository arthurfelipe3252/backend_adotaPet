import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ADOPTION_REQUEST_REPOSITORY,
  type AdoptionRequestRepository,
} from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';
import {
  AdoptionPreTriageStatus,
  AdoptionRequest,
} from '@adoption/adoption-requests/domain/models/adoption-request.entity';
import type {
  AdoptionRequestResponseDto,
  CreateAdoptionRequestDto,
  UpdateAdoptionRequestStatusDto,
} from '@adoption/adoption-requests/application/dto/adoption-request.dto';
import { AdoptionMessagingService } from './adoption-messaging.service';
import {
  ADOPTION_PET_REPOSITORY,
  type AdoptionPetRepository,
} from '@adoption/pets/domain/repositories/adoption-pet-repository.interface';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
  type ProfileView,
} from '@adoption/profiles/domain/repositories/profile-repository.interface';

interface JwtUser {
  sub: string;
  // Um token carrega APENAS o id do perfil correspondente ao tipoUsuario
  // (adotante → adotanteId, protetor/ong → protetorId). Por isso opcionais.
  adotanteId?: string;
  protetorId?: string;
  tipoUsuario: string;
  permissions: string[];
}

@Injectable()
export class AdoptionRequestService {
  constructor(
    @Inject(ADOPTION_REQUEST_REPOSITORY)
    private readonly repository: AdoptionRequestRepository,
    private readonly messagingService: AdoptionMessagingService,
    @Inject(ADOPTION_PET_REPOSITORY)
    private readonly adoptionPetRepository: AdoptionPetRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async create(user: JwtUser, dto: CreateAdoptionRequestDto): Promise<AdoptionRequestResponseDto> {
    // Resolve o protetorId do pet a partir da réplica local (alimentada por
    // eventos do catalog). Não confia em campo vindo do cliente; valida o pet.
    const protetorId = await this.adoptionPetRepository.findProtetorIdByPetId(dto.petId);
    if (!protetorId) {
      throw new NotFoundException(`Pet ${dto.petId} não encontrado.`);
    }

    const request = AdoptionRequest.create({
      petId: dto.petId,
      protetorId,
      adopterId: user.adotanteId!,
      notes: dto.mensagem ?? null,
      matchScore: dto.matchScore ?? null,
      matchAnswers: this.resolveMatchAnswers(dto),
      preTriageStatus: this.resolvePreTriageStatus(dto),
      status: 'received',
    });

    const created = await this.repository.create(request);
    await this.messagingService.publishRequestCreated({
      id: created.id!,
      petId: created.petId,
      protetorId,
      adopterId: user.adotanteId!,
      status: created.status,
      createdAt: (created.createdAt ?? new Date()).toISOString(),
      updatedAt: (created.updatedAt ?? new Date()).toISOString(),
    });
    return this.withProfiles(created);
  }

  async findAll(user: JwtUser): Promise<AdoptionRequestResponseDto[]> {
    const isAdotante = user.tipoUsuario === 'adotante';
    const filters = isAdotante
      ? { adopterId: user.adotanteId! }
      : { protetorId: user.protetorId! };
    const requests = await this.repository.findAll(filters);
    return this.mapManyWithProfiles(requests);
  }

  async findById(id: string, user: JwtUser): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException(`Solicitação ${id} não encontrada.`);

    const isAdotante = user.tipoUsuario === 'adotante';
    if (isAdotante && request.adopterId !== user.adotanteId) {
      throw new ForbiddenException('Solicitação pertence a outro adotante');
    }
    if (!isAdotante && request.protetorId !== user.protetorId) {
      throw new ForbiddenException('Solicitação pertence a outro protetor/ong');
    }

    return this.withProfiles(request);
  }

  async updateStatus(
    id: string,
    user: JwtUser,
    dto: UpdateAdoptionRequestStatusDto,
  ): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    if (request.protetorId !== user.protetorId) {
      throw new ForbiddenException('Solicitação pertence a outro protetor/ong');
    }

    request.withStatus(dto.status).touch(new Date());
    await this.repository.update(request);
    await this.messagingService.publishRequestUpdated({
      id: request.id!,
      petId: request.petId,
      status: dto.status,
      adopterId: request.adopterId,
      protetorId: user.protetorId!,
      updatedAt: (request.updatedAt ?? new Date()).toISOString(),
    });

    // Quando aprovada: rejeitar automaticamente todas as outras solicitações
    // do mesmo pet para garantir que apenas uma adoção seja aceita.
    if (dto.status === 'approved') {
      await this.rejectOtherRequestsForPet(request.petId, request.id!);
    }

    return this.withProfiles(request);
  }

  async delete(id: string, user: JwtUser): Promise<void> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    if (request.adopterId !== user.adotanteId) {
      throw new ForbiddenException('Apenas o adotante criador pode excluir');
    }
    await this.repository.delete(id);
  }

  /**
   * Rejeita todas as solicitações pendentes do mesmo pet, exceto a que
   * acabou de ser aprovada. Garante que apenas uma adoção seja aceita por pet.
   */
  private async rejectOtherRequestsForPet(petId: string, approvedRequestId: string): Promise<void> {
    const allRequests = await this.repository.findByPetId(petId);
    const now = new Date();

    for (const r of allRequests) {
      if (r.id === approvedRequestId) continue;
      // Rejeitar apenas solicitações que ainda não foram finalizadas
      if (r.status === 'approved' || r.status === 'rejected') continue;

      r.withStatus('rejected').touch(now);
      await this.repository.update(r);
    }
  }

  private mapToResponse(
    r: AdoptionRequest,
    adopter: { id: string; nome: string } | null = null,
    protetor: { id: string; nome: string } | null = null,
  ): AdoptionRequestResponseDto {
    return {
      id: r.id!,
      petId: r.petId,
      adopterId: r.adopterId,
      protetorId: r.protetorId ?? null,
      adopter,
      protetor,
      status: r.status,
      preTriageStatus: r.preTriageStatus,
      matchScore: r.matchScore ?? null,
      matchAnswers: r.matchAnswers ?? null,
      notes: r.notes ?? null,
      createdAt: r.createdAt!,
      updatedAt: r.updatedAt!,
    };
  }

  private toSummary(p?: ProfileView | null): { id: string; nome: string } | null {
    return p ? { id: p.id, nome: p.nome } : null;
  }

  /** Resolve adopter+protetor da réplica de perfis e monta a resposta (item único). */
  private async withProfiles(r: AdoptionRequest): Promise<AdoptionRequestResponseDto> {
    const ids = [r.adopterId, r.protetorId].filter((x): x is string => !!x);
    const profiles = await this.profileRepository.findByIds(ids);
    return this.mapToResponse(
      r,
      this.toSummary(profiles.get(r.adopterId)),
      r.protetorId ? this.toSummary(profiles.get(r.protetorId)) : null,
    );
  }

  /** Versão em lote (lookup único de perfis) pra listas. */
  private async mapManyWithProfiles(
    rs: AdoptionRequest[],
  ): Promise<AdoptionRequestResponseDto[]> {
    const ids = [
      ...new Set(
        rs.flatMap((r) => [r.adopterId, r.protetorId]).filter((x): x is string => !!x),
      ),
    ];
    const profiles = await this.profileRepository.findByIds(ids);
    return rs.map((r) =>
      this.mapToResponse(
        r,
        this.toSummary(profiles.get(r.adopterId)),
        r.protetorId ? this.toSummary(profiles.get(r.protetorId)) : null,
      ),
    );
  }

  private resolvePreTriageStatus(dto: CreateAdoptionRequestDto): AdoptionPreTriageStatus {
    if (dto.preTriageStatus) return dto.preTriageStatus;
    if (typeof dto.matchScore === 'number') {
      return dto.matchScore >= 70 ? 'qualified' : 'disqualified';
    }
    return 'review';
  }

  private resolveMatchAnswers(
    dto: CreateAdoptionRequestDto,
  ): Record<string, string | number | boolean | null> | null {
    if (dto.matchAnswers) return dto.matchAnswers;
    if (!dto.questionario) return null;
    return {
      tipoMoradia: dto.questionario.tipoMoradia,
      horasDisponiveisDia: dto.questionario.horasDisponiveisDia,
      temExperiencia: dto.questionario.temExperiencia,
      temCriancas: dto.questionario.temCriancas,
      temOutrosPets: dto.questionario.temOutrosPets,
    };
  }
}
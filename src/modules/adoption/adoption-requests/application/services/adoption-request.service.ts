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
import {
  type AdoptionRequestResponseDto,
  type CreateAdoptionRequestDto,
  type ProfileSummaryDto,
  type UpdateAdoptionRequestStatusDto,
} from '@adoption/adoption-requests/application/dto/adoption-request.dto';
import {
  ADOTANTE_REPOSITORY,
  type AdotanteRepository,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import {
  PROTETOR_ONG_REPOSITORY,
  type ProtetorOngRepository,
} from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import {
  PET_REPOSITORY,
  type PetRepository,
} from '@catalog/pets/domain/repositories/pet-repository.interface';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import {
  resolveAdotanteIdOrFail,
  resolveProtetorIdOrFail,
} from '@identity/usuarios/application/helpers/resolve-profile-id.helper';
import {
  buildAdotanteSummaryMap,
  buildProtetorSummaryMap,
  fetchAdotanteSummary,
  fetchProtetorSummary,
} from '@identity/usuarios/application/helpers/profile-summary.helper';

/**
 * Regras de autorização do contexto @adoption:
 *
 *  - POST   /adoptions          adopterId vem do JWT (apenas adotante);
 *                                protetorId é derivado de `pets.protetor_id`
 *  - GET    /adoptions          adotante vê só as próprias; protetor/ong
 *                                vê as direcionadas a ele
 *  - GET    /adoptions/:id      precisa ser o adotante criador OU o
 *                                protetor/ong dono do pet
 *  - PATCH  /adoptions/:id/status  apenas o protetor/ong dono do pet
 *  - DELETE /adoptions/:id      apenas o adotante criador
 *
 * As responses são enriquecidas com summary (id + nome) do adotante e
 * do protetor — em listas via batch lookup pra evitar N+1.
 */
@Injectable()
export class AdoptionRequestService {
  constructor(
    @Inject(ADOPTION_REQUEST_REPOSITORY)
    private readonly repository: AdoptionRequestRepository,
    @Inject(ADOTANTE_REPOSITORY)
    private readonly adotanteRepository: AdotanteRepository,
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorRepository: ProtetorOngRepository,
    @Inject(PET_REPOSITORY)
    private readonly petRepository: PetRepository,
  ) {}

  async create(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: CreateAdoptionRequestDto,
  ): Promise<AdoptionRequestResponseDto> {
    const adopterId = await resolveAdotanteIdOrFail(
      this.adotanteRepository,
      usuarioId,
      tipoUsuario,
    );

    const pet = await this.petRepository.findById(dto.petId);
    if (!pet) {
      throw new NotFoundException(`Pet ${dto.petId} não encontrado.`);
    }

    const request = AdoptionRequest.create({
      petId: dto.petId,
      protetorId: pet.protetorId ?? null,
      adopterId,
      notes: dto.mensagem ?? null,
      matchScore: dto.matchScore ?? null,
      matchAnswers: this.resolveMatchAnswers(dto),
      preTriageStatus: this.resolvePreTriageStatus(dto),
      status: 'received',
    });

    const created = await this.repository.create(request);
    return this.toResponseSingle(created);
  }

  async findAll(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<AdoptionRequestResponseDto[]> {
    let requests: AdoptionRequest[];

    if (tipoUsuario === TipoUsuario.Adotante) {
      const adopterId = await resolveAdotanteIdOrFail(
        this.adotanteRepository,
        usuarioId,
        tipoUsuario,
      );
      requests = await this.repository.findAll({ adopterId });
    } else {
      const protetorId = await resolveProtetorIdOrFail(
        this.protetorRepository,
        usuarioId,
        tipoUsuario,
      );
      requests = await this.repository.findAll({ protetorId });
    }

    return this.toResponseBatch(requests);
  }

  async findById(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    }
    await this.assertCanRead(request, usuarioId, tipoUsuario);
    return this.toResponseSingle(request);
  }

  async updateStatus(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: UpdateAdoptionRequestStatusDto,
  ): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    }

    const protetorId = await resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
    if (request.protetorId !== protetorId) {
      throw new ForbiddenException('Solicitação pertence a outro protetor/ong');
    }

    request.withStatus(dto.status).touch(new Date());
    await this.repository.update(request);
    return this.toResponseSingle(request);
  }

  async delete(
    id: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<void> {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    }

    const adopterId = await resolveAdotanteIdOrFail(
      this.adotanteRepository,
      usuarioId,
      tipoUsuario,
    );
    if (request.adopterId !== adopterId) {
      throw new ForbiddenException('Apenas o adotante criador pode excluir');
    }

    await this.repository.delete(id);
  }

  private async assertCanRead(
    request: AdoptionRequest,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<void> {
    if (tipoUsuario === TipoUsuario.Adotante) {
      const adopterId = await resolveAdotanteIdOrFail(
        this.adotanteRepository,
        usuarioId,
        tipoUsuario,
      );
      if (request.adopterId !== adopterId) {
        throw new ForbiddenException('Solicitação pertence a outro adotante');
      }
      return;
    }

    const protetorId = await resolveProtetorIdOrFail(
      this.protetorRepository,
      usuarioId,
      tipoUsuario,
    );
    if (request.protetorId !== protetorId) {
      throw new ForbiddenException('Solicitação pertence a outro protetor/ong');
    }
  }

  private async toResponseBatch(
    requests: AdoptionRequest[],
  ): Promise<AdoptionRequestResponseDto[]> {
    const [adopters, protetores] = await Promise.all([
      buildAdotanteSummaryMap(
        this.adotanteRepository,
        requests.map((r) => r.adopterId),
      ),
      buildProtetorSummaryMap(
        this.protetorRepository,
        requests.map((r) => r.protetorId),
      ),
    ]);
    return requests.map((r) =>
      this.mapToResponse(
        r,
        adopters.get(r.adopterId) ?? null,
        r.protetorId ? (protetores.get(r.protetorId) ?? null) : null,
      ),
    );
  }

  private async toResponseSingle(
    request: AdoptionRequest,
  ): Promise<AdoptionRequestResponseDto> {
    const [adopter, protetor] = await Promise.all([
      fetchAdotanteSummary(this.adotanteRepository, request.adopterId),
      fetchProtetorSummary(this.protetorRepository, request.protetorId),
    ]);
    return this.mapToResponse(request, adopter, protetor);
  }

  private mapToResponse(
    r: AdoptionRequest,
    adopter: ProfileSummaryDto | null,
    protetor: ProfileSummaryDto | null,
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

  private resolvePreTriageStatus(
    dto: CreateAdoptionRequestDto,
  ): AdoptionPreTriageStatus {
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

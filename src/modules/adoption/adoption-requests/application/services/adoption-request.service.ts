import { Inject, Injectable } from '@nestjs/common';
import {
  ADOPTION_REQUEST_REPOSITORY,
  type AdoptionRequestRepository,
} from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';
import {
  AdoptionPreTriageStatus,
  AdoptionRequest,
} from '@adoption/adoption-requests/domain/models/adoption-request.entity';
import {
  type CreateAdoptionRequestDto,
  type UpdateAdoptionRequestStatusDto,
} from '@adoption/adoption-requests/application/dto/adoption-request.dto';

@Injectable()
export class AdoptionRequestService {
  constructor(
    @Inject(ADOPTION_REQUEST_REPOSITORY)
    private readonly repository: AdoptionRequestRepository,
  ) {}

  async create(dto: CreateAdoptionRequestDto): Promise<AdoptionRequest> {
    const request = AdoptionRequest.create({
      petId: dto.petId,
      protetorId: dto.protetorId ?? null,
      adopterId: dto.adopterId,
      notes: dto.mensagem ?? null,
      matchScore: dto.matchScore ?? null,
      matchAnswers: this.resolveMatchAnswers(dto),
      preTriageStatus: this.resolvePreTriageStatus(dto),
      status: 'received',
    });

    await this.repository.create(request);
    return request;
  }

  async updateStatus(
    id: string,
    dto: UpdateAdoptionRequestStatusDto,
  ): Promise<AdoptionRequest | null> {
    const request = await this.repository.findById(id);
    if (!request) return null;

    request.withStatus(dto.status).touch(new Date());
    await this.repository.update(request);
    return request;
  }

  async findAll(): Promise<AdoptionRequest[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<AdoptionRequest | null> {
    return this.repository.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
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

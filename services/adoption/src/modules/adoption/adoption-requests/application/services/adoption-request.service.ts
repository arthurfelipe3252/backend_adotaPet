import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from '@shared/infra/hateoas';
import { AdoptionRequest } from '@adoption/adoption-requests/domain/models/adoption-request.entity';
import type { AdoptionPreTriageStatus } from '@adoption/adoption-requests/domain/models/adoption-request.entity';
import {
  ADOPTION_REQUEST_REPOSITORY,
  type AdoptionRequestRepository,
} from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';
import {
  AdoptionRequestResponseDto,
  type CreateAdoptionRequestDto,
  type UpdateAdoptionRequestStatusDto,
} from '../dto/adoption-request.dto';
import { AdoptionRequestMessagingService } from './adoption-request-messaging.service';

@Injectable()
export class AdoptionRequestService {
  constructor(
    @Inject(ADOPTION_REQUEST_REPOSITORY)
    private readonly repository: AdoptionRequestRepository,
    private readonly messagingService: AdoptionRequestMessagingService,
  ) {}

  async create(dto: CreateAdoptionRequestDto): Promise<AdoptionRequestResponseDto> {
    const request = AdoptionRequest.create({
      petId: dto.petId,
      protetorId: dto.protetorId ?? null,
      adopterId: dto.adopterId,
      notes: dto.mensagem ?? null,
      matchScore: dto.matchScore ?? null,
      matchAnswers: dto.matchAnswers ?? null,
      preTriageStatus: dto.preTriageStatus ?? this.resolvePreTriageStatus(dto),
      status: 'received',
    });

    await this.repository.create(request);
    const response = AdoptionRequestResponseDto.fromRequest(request)!;
    await this.messagingService.publishRequestCreated(response);
    return response;
  }

  async listPaginated(params: PaginationParams): Promise<{ rows: AdoptionRequestResponseDto[]; total: number }> {
    const result = await this.repository.findAllPaginated(params);
    return { rows: result.rows.map((r) => AdoptionRequestResponseDto.fromRequest(r)!), total: result.total };
  }

  async findById(id: string): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    return AdoptionRequestResponseDto.fromRequest(request)!;
  }

  async updateStatus(id: string, dto: UpdateAdoptionRequestStatusDto): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    request.withStatus(dto.status).touch(new Date());
    await this.repository.update(request);
    const response = AdoptionRequestResponseDto.fromRequest(request)!;
    await this.messagingService.publishRequestUpdated(response);
    return response;
  }

  async delete(id: string): Promise<void> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    await this.repository.delete(id);
  }

  private resolvePreTriageStatus(dto: CreateAdoptionRequestDto): AdoptionPreTriageStatus {
    if (typeof dto.matchScore === 'number') {
      return dto.matchScore >= 70 ? 'qualified' : 'disqualified';
    }
    return 'review';
  }
}

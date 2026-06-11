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

interface JwtUser {
  sub: string;
  tipoUsuario: string;
  permissions: string[];
}

@Injectable()
export class AdoptionRequestService {
  constructor(
    @Inject(ADOPTION_REQUEST_REPOSITORY)
    private readonly repository: AdoptionRequestRepository,
    private readonly messagingService: AdoptionMessagingService,
  ) {}

  async create(user: JwtUser, dto: CreateAdoptionRequestDto): Promise<AdoptionRequestResponseDto> {
    const request = AdoptionRequest.create({
      petId: dto.petId,
      protetorId: dto.protetorId ?? null,
      adopterId: user.sub,
      notes: dto.mensagem ?? null,
      matchScore: dto.matchScore ?? null,
      matchAnswers: this.resolveMatchAnswers(dto),
      preTriageStatus: this.resolvePreTriageStatus(dto),
      status: 'received',
    });

    const created = await this.repository.create(request);
    await this.messagingService.publishRequestCreated({ id: created.id!, adopterId: user.sub });
    return this.mapToResponse(created);
  }

  async findAll(user: JwtUser): Promise<AdoptionRequestResponseDto[]> {
    const isAdotante = user.tipoUsuario === 'adotante';
    const filters = isAdotante
      ? { adopterId: user.sub }
      : { protetorId: user.sub };
    const requests = await this.repository.findAll(filters);
    return requests.map((r) => this.mapToResponse(r));
  }

  async findById(id: string, user: JwtUser): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException(`Solicitação ${id} não encontrada.`);

    const isAdotante = user.tipoUsuario === 'adotante';
    if (isAdotante && request.adopterId !== user.sub) {
      throw new ForbiddenException('Solicitação pertence a outro adotante');
    }
    if (!isAdotante && request.protetorId !== user.sub) {
      throw new ForbiddenException('Solicitação pertence a outro protetor/ong');
    }

    return this.mapToResponse(request);
  }

  async updateStatus(
    id: string,
    user: JwtUser,
    dto: UpdateAdoptionRequestStatusDto,
  ): Promise<AdoptionRequestResponseDto> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    if (request.protetorId !== user.sub) {
      throw new ForbiddenException('Solicitação pertence a outro protetor/ong');
    }

    request.withStatus(dto.status).touch(new Date());
    await this.repository.update(request);
    await this.messagingService.publishRequestUpdated({
      id: request.id!,
      status: dto.status,
      adopterId: request.adopterId,
      protetorId: user.sub,
    });
    return this.mapToResponse(request);
  }

  async delete(id: string, user: JwtUser): Promise<void> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    if (request.adopterId !== user.sub) {
      throw new ForbiddenException('Apenas o adotante criador pode excluir');
    }
    await this.repository.delete(id);
  }

  private mapToResponse(r: AdoptionRequest): AdoptionRequestResponseDto {
    return {
      id: r.id!,
      petId: r.petId,
      adopterId: r.adopterId,
      protetorId: r.protetorId ?? null,
      adopter: null,
      protetor: null,
      status: r.status,
      preTriageStatus: r.preTriageStatus,
      matchScore: r.matchScore ?? null,
      matchAnswers: r.matchAnswers ?? null,
      notes: r.notes ?? null,
      createdAt: r.createdAt!,
      updatedAt: r.updatedAt!,
    };
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

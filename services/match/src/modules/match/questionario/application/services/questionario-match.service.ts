import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QUESTIONARIO_MATCH_REPOSITORY } from '@match/questionario/domain/repositories/questionario-match-repository.interface';
import type { QuestionarioMatchRepository } from '@match/questionario/domain/repositories/questionario-match-repository.interface';
import { QuestionarioMatch } from '@match/questionario/domain/models/questionario-match.entity';
import { MATCH_PET_REPOSITORY } from '@match/pets/domain/repositories/match-pet-repository.interface';
import type { MatchPetRepository } from '@match/pets/domain/repositories/match-pet-repository.interface';
import { MatchScoringService } from './match-scoring.service';
import type {
  SalvarQuestionarioDto,
  MatchResultItemDto,
  MatchResultResponseDto,
  QuestionarioMatchResponseDto,
} from '@match/questionario/application/dto/questionario-match.dto';

interface JwtUser {
  sub: string;
  adotanteId: string;
  tipoUsuario: string;
}

@Injectable()
export class QuestionarioMatchService {
  constructor(
    @Inject(QUESTIONARIO_MATCH_REPOSITORY)
    private readonly questionarioRepo: QuestionarioMatchRepository,
    @Inject(MATCH_PET_REPOSITORY)
    private readonly matchPetRepo: MatchPetRepository,
    private readonly scoring: MatchScoringService,
  ) {}

  private toResponse(q: QuestionarioMatch): QuestionarioMatchResponseDto {
    return {
      id: q.id!,
      adotanteId: q.adotanteId,
      tipoMoradia: q.tipoMoradia,
      disponibilidade: q.disponibilidade,
      experienciaPrevia: q.experienciaPrevia,
      criancasEmCasa: q.criancasEmCasa,
      outrosPets: q.outrosPets,
      perfilCompanheiro: q.perfilCompanheiro,
      createdAt: q.createdAt!,
      updatedAt: q.updatedAt!,
    };
  }

  async salvar(user: JwtUser, dto: SalvarQuestionarioDto): Promise<QuestionarioMatchResponseDto> {
    const questionario = QuestionarioMatch.create({
      adotanteId: user.adotanteId,
      tipoMoradia: dto.tipoMoradia,
      disponibilidade: dto.disponibilidade,
      experienciaPrevia: dto.experienciaPrevia,
      criancasEmCasa: dto.criancasEmCasa,
      outrosPets: dto.outrosPets,
      perfilCompanheiro: dto.perfilCompanheiro,
    });
    const salvo = await this.questionarioRepo.upsert(questionario);
    return this.toResponse(salvo);
  }

  async buscarMeu(user: JwtUser): Promise<QuestionarioMatchResponseDto> {
    return this.buscarInterno(user.adotanteId);
  }

  async buscarPorAdotante(adotanteIdParam: string, user: JwtUser): Promise<QuestionarioMatchResponseDto> {
    if (adotanteIdParam !== user.adotanteId) {
      throw new ForbiddenException('Você só pode acessar seu próprio questionário de match');
    }
    return this.buscarInterno(adotanteIdParam);
  }

  async calcularMeuMatch(user: JwtUser): Promise<MatchResultResponseDto> {
    return this.calcularInterno(user.adotanteId);
  }

  async calcularMatch(adotanteIdParam: string, user: JwtUser): Promise<MatchResultResponseDto> {
    if (adotanteIdParam !== user.adotanteId) {
      throw new ForbiddenException('Você só pode calcular seu próprio match');
    }
    return this.calcularInterno(adotanteIdParam);
  }

  async remover(user: JwtUser): Promise<void> {
    const q = await this.questionarioRepo.findByAdotanteId(user.adotanteId);
    if (!q) {
      throw new NotFoundException(
        `Adotante ${user.adotanteId} não possui questionário de match.`,
      );
    }
    await this.questionarioRepo.deleteByAdotanteId(user.adotanteId);
  }

  private async buscarInterno(adotanteId: string): Promise<QuestionarioMatchResponseDto> {
    const q = await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!q) {
      throw new NotFoundException(
        `Adotante ${adotanteId} ainda não respondeu ao questionário de match.`,
      );
    }
    return this.toResponse(q);
  }

  private async calcularInterno(adotanteId: string): Promise<MatchResultResponseDto> {
    const questionario = await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!questionario) {
      throw new NotFoundException(
        `Adotante ${adotanteId} ainda não respondeu ao questionário de match. ` +
          `Envie as respostas em POST /v1/match/questionario antes de calcular.`,
      );
    }

    const pets = await this.matchPetRepo.findAvailable();
    const resultados: MatchResultItemDto[] = pets
      .map((pet) => ({
        petId: pet.id,
        nome: pet.nome,
        especie: pet.especie,
        raca: pet.raca ?? null,
        porte: pet.porte,
        sexo: pet.sexo,
        idadeMeses: pet.idadeMeses,
        castrado: pet.castrado,
        vacinado: pet.vacinado,
        temperamento: pet.temperamento ?? null,
        fotosUrls: pet.fotosUrls ? (JSON.parse(pet.fotosUrls) as string[]) : [],
        score: this.scoring.calcularScore(pet, questionario),
      }))
      .sort((a, b) => b.score - a.score);

    return {
      adotanteId,
      questionario: this.toResponse(questionario),
      resultados,
      totalPetsAnalisados: pets.length,
      geradoEm: new Date(),
    };
  }
}

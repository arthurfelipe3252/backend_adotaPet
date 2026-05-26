import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PET_REPOSITORY } from "@catalog/pets/domain/repositories/pet-repository.interface";
import type { PetRepository } from "@catalog/pets/domain/repositories/pet-repository.interface";
import { QUESTIONARIO_MATCH_REPOSITORY } from "@match/questionario/domain/repositories/questionario-match-repository.interface";
import type { QuestionarioMatchRepository } from "@match/questionario/domain/repositories/questionario-match-repository.interface";
import { QuestionarioMatch } from "@match/questionario/domain/models/questionario-match.entity";
import { MatchScoringService } from "./match-scoring.service";
import type {
  SalvarQuestionarioDto,
  MatchResultItemDto,
  MatchResultResponseDto,
  QuestionarioMatchResponseDto,
} from "@match/questionario/application/dto/questionario-match.dto";

@Injectable()
export class QuestionarioMatchService {
  constructor(
    @Inject(QUESTIONARIO_MATCH_REPOSITORY)
    private readonly questionarioRepo: QuestionarioMatchRepository,
    @Inject(PET_REPOSITORY)
    private readonly petRepo: PetRepository,
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

  async salvar(adotanteId: string, dto: SalvarQuestionarioDto): Promise<QuestionarioMatchResponseDto> {
    const questionario = QuestionarioMatch.create({
      adotanteId,
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

  async buscarPorAdotante(adotanteId: string): Promise<QuestionarioMatchResponseDto> {
    const q = await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!q) throw new NotFoundException(`Adotante ${adotanteId} ainda não respondeu ao questionário de match.`);
    return this.toResponse(q);
  }

  async calcularMatch(adotanteId: string): Promise<MatchResultResponseDto> {
    const questionario = await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!questionario) {
      throw new NotFoundException(
        `Adotante ${adotanteId} ainda não respondeu ao questionário de match. ` +
        `Envie as respostas em POST /api/v1/match/questionario antes de calcular.`,
      );
    }
    const pets = await this.petRepo.findAll({ status: "disponivel" });
    const resultados: MatchResultItemDto[] = pets
      .map((pet) => ({
        petId: pet.id!,
        nome: pet.nome,
        especie: pet.especie,
        raca: pet.raca ?? null,
        porte: pet.porte,
        sexo: pet.sexo,
        idadeMeses: pet.idadeMeses,
        castrado: pet.castrado,
        vacinado: pet.vacinado,
        temperamento: pet.temperamento ?? null,
        fotosUrls: pet.fotosUrls ?? [],
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

  async remover(adotanteId: string): Promise<void> {
    const q = await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!q) throw new NotFoundException(`Adotante ${adotanteId} não possui questionário de match.`);
    await this.questionarioRepo.deleteByAdotanteId(adotanteId);
  }
}

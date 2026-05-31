import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PET_REPOSITORY } from '@catalog/pets/domain/repositories/pet-repository.interface';
import type { PetRepository } from '@catalog/pets/domain/repositories/pet-repository.interface';
import { QUESTIONARIO_MATCH_REPOSITORY } from '@match/questionario/domain/repositories/questionario-match-repository.interface';
import type { QuestionarioMatchRepository } from '@match/questionario/domain/repositories/questionario-match-repository.interface';
import { QuestionarioMatch } from '@match/questionario/domain/models/questionario-match.entity';
import {
  ADOTANTE_REPOSITORY,
  type AdotanteRepository,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import { resolveAdotanteIdOrFail } from '@identity/usuarios/application/helpers/resolve-profile-id.helper';
import { MatchScoringService } from './match-scoring.service';
import type {
  SalvarQuestionarioDto,
  MatchResultItemDto,
  MatchResultResponseDto,
  QuestionarioMatchResponseDto,
} from '@match/questionario/application/dto/questionario-match.dto';

/**
 * Regras de autorização do contexto @match/questionario:
 *
 *  - Todos os endpoints exigem JWT (guard global).
 *  - Apenas usuários do tipo `adotante` podem ler/escrever — protetores/
 *    ONGs não têm questionário próprio. O ID resolvido é
 *    `adotantes.id`, NÃO `usuarios.id`.
 *  - Os endpoints com `:adotanteId` na URL aplicam ownership: 403 se
 *    o ID não corresponder ao adotante autenticado. Servem só pra
 *    quando o frontend já tem o adotanteId em mãos.
 */
@Injectable()
export class QuestionarioMatchService {
  constructor(
    @Inject(QUESTIONARIO_MATCH_REPOSITORY)
    private readonly questionarioRepo: QuestionarioMatchRepository,
    @Inject(PET_REPOSITORY)
    private readonly petRepo: PetRepository,
    @Inject(ADOTANTE_REPOSITORY)
    private readonly adotanteRepo: AdotanteRepository,
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

  async salvar(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
    dto: SalvarQuestionarioDto,
  ): Promise<QuestionarioMatchResponseDto> {
    const adotanteId = await resolveAdotanteIdOrFail(
      this.adotanteRepo,
      usuarioId,
      tipoUsuario,
    );

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

  async buscarMeu(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<QuestionarioMatchResponseDto> {
    const adotanteId = await resolveAdotanteIdOrFail(
      this.adotanteRepo,
      usuarioId,
      tipoUsuario,
    );
    return this.buscarInterno(adotanteId);
  }

  async buscarPorAdotante(
    adotanteIdParam: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<QuestionarioMatchResponseDto> {
    await this.assertOwner(adotanteIdParam, usuarioId, tipoUsuario);
    return this.buscarInterno(adotanteIdParam);
  }

  async calcularMeuMatch(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<MatchResultResponseDto> {
    const adotanteId = await resolveAdotanteIdOrFail(
      this.adotanteRepo,
      usuarioId,
      tipoUsuario,
    );
    return this.calcularInterno(adotanteId);
  }

  async calcularMatch(
    adotanteIdParam: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<MatchResultResponseDto> {
    await this.assertOwner(adotanteIdParam, usuarioId, tipoUsuario);
    return this.calcularInterno(adotanteIdParam);
  }

  async remover(
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<void> {
    const adotanteId = await resolveAdotanteIdOrFail(
      this.adotanteRepo,
      usuarioId,
      tipoUsuario,
    );
    const q = await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!q) {
      throw new NotFoundException(
        `Adotante ${adotanteId} não possui questionário de match.`,
      );
    }
    await this.questionarioRepo.deleteByAdotanteId(adotanteId);
  }

  private async assertOwner(
    adotanteIdParam: string,
    usuarioId: string,
    tipoUsuario: TipoUsuario,
  ): Promise<void> {
    const adotanteId = await resolveAdotanteIdOrFail(
      this.adotanteRepo,
      usuarioId,
      tipoUsuario,
    );
    if (adotanteId !== adotanteIdParam) {
      throw new ForbiddenException(
        'Você só pode acessar seu próprio questionário de match',
      );
    }
  }

  private async buscarInterno(
    adotanteId: string,
  ): Promise<QuestionarioMatchResponseDto> {
    const q = await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!q) {
      throw new NotFoundException(
        `Adotante ${adotanteId} ainda não respondeu ao questionário de match.`,
      );
    }
    return this.toResponse(q);
  }

  private async calcularInterno(
    adotanteId: string,
  ): Promise<MatchResultResponseDto> {
    const questionario =
      await this.questionarioRepo.findByAdotanteId(adotanteId);
    if (!questionario) {
      throw new NotFoundException(
        `Adotante ${adotanteId} ainda não respondeu ao questionário de match. ` +
          `Envie as respostas em POST /api/v1/match/questionario antes de calcular.`,
      );
    }
    const pets = await this.petRepo.findAll({ status: 'disponivel' });
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
}

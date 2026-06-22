import { Module } from '@nestjs/common';
import { QuestionarioMatchController } from './questionario/infra/controllers/questionario-match.controller';
import { QuestionarioMatchService } from './questionario/application/services/questionario-match.service';
import { MatchScoringService } from './questionario/application/services/match-scoring.service';
import { DrizzleQuestionarioMatchRepository } from './questionario/infra/repositories/drizzle-questionario-match.repository';
import { QUESTIONARIO_MATCH_REPOSITORY } from './questionario/domain/repositories/questionario-match-repository.interface';
import { DrizzleMatchPetRepository } from './pets/infra/repositories/drizzle-match-pet.repository';
import { MATCH_PET_REPOSITORY } from './pets/domain/repositories/match-pet-repository.interface';
import { CatalogPetConsumer } from './pets/infra/consumers/catalog-pet-consumer.service';

@Module({
  controllers: [QuestionarioMatchController],
  providers: [
    QuestionarioMatchService,
    MatchScoringService,
    DrizzleQuestionarioMatchRepository,
    {
      provide: QUESTIONARIO_MATCH_REPOSITORY,
      useExisting: DrizzleQuestionarioMatchRepository,
    },
    // Réplica local de pets alimentada por eventos do catalog
    DrizzleMatchPetRepository,
    {
      provide: MATCH_PET_REPOSITORY,
      useExisting: DrizzleMatchPetRepository,
    },
    CatalogPetConsumer,
  ],
  exports: [QuestionarioMatchService],
})
export class MatchModule {}

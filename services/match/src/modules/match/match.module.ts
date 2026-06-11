import { Module } from '@nestjs/common';
import { QuestionarioMatchController } from './questionario/infra/controllers/questionario-match.controller';
import { QuestionarioMatchService } from './questionario/application/services/questionario-match.service';
import { MatchScoringService } from './questionario/application/services/match-scoring.service';
import { DrizzleQuestionarioMatchRepository } from './questionario/infra/repositories/drizzle-questionario-match.repository';
import { QUESTIONARIO_MATCH_REPOSITORY } from './questionario/domain/repositories/questionario-match-repository.interface';

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
  ],
  exports: [QuestionarioMatchService],
})
export class MatchModule {}

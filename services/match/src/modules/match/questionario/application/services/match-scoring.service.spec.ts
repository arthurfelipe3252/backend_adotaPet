import { MatchScoringService } from './match-scoring.service';
import { QuestionarioMatch } from '@match/questionario/domain/models/questionario-match.entity';

const buildQuestionario = (overrides: Record<string, unknown> = {}) =>
  QuestionarioMatch.restore({
    id: 'q-id',
    adotanteId: 'adotante-id',
    tipoMoradia: overrides.tipoMoradia ?? 'casa_quintal_grande',
    disponibilidade: overrides.disponibilidade ?? 'fica_em_casa',
    experienciaPrevia: overrides.experienciaPrevia ?? false,
    criancasEmCasa: overrides.criancasEmCasa ?? 'nao',
    outrosPets: overrides.outrosPets ?? 'nao',
    perfilCompanheiro: overrides.perfilCompanheiro ?? 'carinhoso',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any)!;

describe('MatchScoringService', () => {
  const service = new MatchScoringService();

  describe('calcularScore', () => {
    it('returns a number between 0 and 100', () => {
      const q = buildQuestionario();
      const score = service.calcularScore(
        { porte: 'medio', especie: 'cao', temperamento: 'carinhoso' },
        q,
      );

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('scores cat high regardless of moradia (gatos adaptam-se a apartamento)', () => {
      const q = buildQuestionario({ tipoMoradia: 'apartamento_sem_lazer' });
      const score = service.calcularScore(
        { porte: 'pequeno', especie: 'gato', temperamento: 'tranquilo' },
        q,
      );

      const scoreWithQuintal = service.calcularScore(
        { porte: 'pequeno', especie: 'gato', temperamento: 'tranquilo' },
        buildQuestionario({ tipoMoradia: 'casa_quintal_grande' }),
      );

      expect(score).toBe(scoreWithQuintal);
    });

    it('scores large dog lower in apartment without leisure', () => {
      const q = buildQuestionario({ tipoMoradia: 'apartamento_sem_lazer' });
      const smallScore = service.calcularScore(
        { porte: 'grande', especie: 'cao', temperamento: null },
        q,
      );

      const qQuintal = buildQuestionario({ tipoMoradia: 'casa_quintal_grande' });
      const largeScore = service.calcularScore(
        { porte: 'grande', especie: 'cao', temperamento: null },
        qQuintal,
      );

      expect(largeScore).toBeGreaterThan(smallScore);
    });

    it('scores higher when companion profile matches temperamento', () => {
      const q = buildQuestionario({ perfilCompanheiro: 'carinhoso' });
      const matched = service.calcularScore(
        { porte: 'pequeno', especie: 'cao', temperamento: 'carinhoso' },
        q,
      );
      const unmatched = service.calcularScore(
        { porte: 'pequeno', especie: 'cao', temperamento: 'territorial' },
        q,
      );

      expect(matched).toBeGreaterThan(unmatched);
    });

    it('scores lower when pet has unstable temperamento and there are babies', () => {
      const qBebe = buildQuestionario({ criancasEmCasa: 'bebe' });
      const qNao = buildQuestionario({ criancasEmCasa: 'nao' });

      const withBebe = service.calcularScore(
        { porte: 'medio', especie: 'cao', temperamento: 'agressivo' },
        qBebe,
      );
      const withoutCriancas = service.calcularScore(
        { porte: 'medio', especie: 'cao', temperamento: 'agressivo' },
        qNao,
      );

      expect(withBebe).toBeLessThan(withoutCriancas);
    });

    it('scores lower for user that travels frequently with dependent dog', () => {
      const qViaja = buildQuestionario({ disponibilidade: 'viaja_frequentemente' });
      const qFica = buildQuestionario({ disponibilidade: 'fica_em_casa' });

      const viagemScore = service.calcularScore(
        { porte: 'grande', especie: 'cao', temperamento: null },
        qViaja,
      );
      const ficaScore = service.calcularScore(
        { porte: 'grande', especie: 'cao', temperamento: null },
        qFica,
      );

      expect(ficaScore).toBeGreaterThan(viagemScore);
    });

    it('returns integer (rounds score)', () => {
      const q = buildQuestionario();
      const score = service.calcularScore({ porte: 'pequeno', especie: 'cao' }, q);

      expect(Number.isInteger(score)).toBe(true);
    });
  });
});

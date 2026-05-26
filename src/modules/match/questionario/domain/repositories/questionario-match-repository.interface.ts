import type { QuestionarioMatch } from "../models/questionario-match.entity";

export const QUESTIONARIO_MATCH_REPOSITORY = Symbol("QUESTIONARIO_MATCH_REPOSITORY");

export interface QuestionarioMatchRepository {
  /** Salva ou substitui o questionário do adotante (1:1) */
  upsert(questionario: QuestionarioMatch): Promise<QuestionarioMatch>;
  /** Busca pelo adotante — retorna null se ainda não respondeu */
  findByAdotanteId(adotanteId: string): Promise<QuestionarioMatch | null>;
  /** Remove o questionário do adotante */
  deleteByAdotanteId(adotanteId: string): Promise<void>;
}

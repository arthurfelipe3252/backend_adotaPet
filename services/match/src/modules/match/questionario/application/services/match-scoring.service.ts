import { Injectable } from '@nestjs/common';
import type { QuestionarioMatch } from '@match/questionario/domain/models/questionario-match.entity';

interface PetLike {
  porte: string;
  especie: string;
  temperamento?: string | null;
}

@Injectable()
export class MatchScoringService {
  calcularScore(pet: PetLike, questionario: QuestionarioMatch): number {
    let score = 0;
    score += this.scoreMoradia(pet, questionario);
    score += this.scoreDisponibilidade(pet, questionario);
    score += this.scoreCriancas(pet, questionario);
    score += this.scoreOutrosPets(pet, questionario);
    score += this.scorePerfilCompanheiro(pet, questionario);
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private scoreMoradia(pet: PetLike, q: QuestionarioMatch): number {
    const moradia = q.tipoMoradia;
    const porte = pet.porte;
    const especie = pet.especie;
    if (especie === 'gato') return 25;
    if (porte === 'grande') {
      if (moradia === 'casa_quintal_grande') return 25;
      if (moradia === 'casa_quintal_pequeno') return 15;
      if (moradia === 'apartamento_lazer') return 8;
      return 2;
    }
    if (porte === 'medio') {
      if (moradia === 'casa_quintal_grande') return 25;
      if (moradia === 'casa_quintal_pequeno') return 22;
      if (moradia === 'apartamento_lazer') return 18;
      return 12;
    }
    if (moradia === 'casa_quintal_grande' || moradia === 'casa_quintal_pequeno')
      return 25;
    if (moradia === 'apartamento_lazer') return 25;
    return 22;
  }

  private scoreDisponibilidade(pet: PetLike, q: QuestionarioMatch): number {
    const disponibilidade = q.disponibilidade;
    const especie = pet.especie;
    const porte = pet.porte;
    if (especie === 'gato') {
      if (disponibilidade === 'viaja_frequentemente') return 12;
      return 25;
    }
    const dependente =
      especie === 'cao' && (porte === 'grande' || porte === 'medio');
    if (disponibilidade === 'fica_em_casa') return 25;
    if (disponibilidade === 'sai_almoco') return dependente ? 18 : 22;
    if (disponibilidade === 'passa_dia_fora') return dependente ? 10 : 16;
    return dependente ? 4 : 10;
  }

  private scoreCriancas(pet: PetLike, q: QuestionarioMatch): number {
    const criancas = q.criancasEmCasa;
    if (criancas === 'nao') return 20;
    const temperamento = (pet.temperamento ?? '').toLowerCase();
    const amigavel = [
      'sociável',
      'carinhoso',
      'brincalhão',
      'tranquilo',
      'apegado',
    ].some((t) => temperamento.includes(t));
    const instavel = ['medroso', 'agressivo', 'territorial'].some((t) =>
      temperamento.includes(t),
    );
    if (instavel)
      return criancas === 'bebe' || criancas === 'crianca_pequena' ? 2 : 10;
    if (amigavel) return 20;
    return criancas === 'bebe' ? 10 : 15;
  }

  private scoreOutrosPets(pet: PetLike, q: QuestionarioMatch): number {
    const outros = q.outrosPets;
    if (outros === 'nao') return 15;
    const especie = pet.especie;
    if (outros === 'cao') {
      if (especie === 'cao') return 12;
      if (especie === 'gato') return 8;
      return 12;
    }
    if (outros === 'gato') {
      if (especie === 'gato') return 8;
      if (especie === 'cao') return 10;
      return 12;
    }
    return 13;
  }

  private scorePerfilCompanheiro(pet: PetLike, q: QuestionarioMatch): number {
    const perfil = q.perfilCompanheiro;
    const temperamento = (pet.temperamento ?? '').toLowerCase();
    const mapaMatch: Record<string, string[]> = {
      tranquilo: ['tranquilo', 'calmo', 'independente'],
      energetico: ['ativo', 'brincalhão', 'inteligente', 'treinado'],
      carinhoso: ['carinhoso', 'apegado', 'sociável'],
      inteligente: ['inteligente', 'treinado', 'ativo'],
    };
    if (!temperamento) return 8;
    const palavrasMatch = mapaMatch[perfil] ?? [];
    const bateu = palavrasMatch.some((p) => temperamento.includes(p));
    return bateu ? 15 : 5;
  }
}

import { IsEnum } from "class-validator";
import type {
  CriancasEmCasa,
  Disponibilidade,
  ExperienciaPrevia,
  OutrosPets,
  PerfilCompanheiro,
  TipoMoradia,
} from "@match/questionario/domain/models/questionario-match.entity";

export class SalvarQuestionarioDto {
  @IsEnum(["casa_quintal_grande", "casa_quintal_pequeno", "apartamento", "apartamento_lazer"])
  tipoMoradia!: TipoMoradia;

  @IsEnum(["fica_em_casa", "sai_almoco", "passa_dia_fora", "viaja_frequentemente"])
  disponibilidade!: Disponibilidade;

  @IsEnum(["sim_tem_experiencia", "sim_faz_tempo", "nunca_quer_aprender", "primeiro_pet_familia"])
  experienciaPrevia!: ExperienciaPrevia;

  @IsEnum(["bebe", "crianca_pequena", "crianca_maior", "nao"])
  criancasEmCasa!: CriancasEmCasa;

  @IsEnum(["cao", "gato", "outros", "nao"])
  outrosPets!: OutrosPets;

  @IsEnum(["tranquilo", "energetico", "carinhoso", "inteligente"])
  perfilCompanheiro!: PerfilCompanheiro;
}

export interface QuestionarioMatchResponseDto {
  id: string;
  adotanteId: string;
  tipoMoradia: TipoMoradia;
  disponibilidade: Disponibilidade;
  experienciaPrevia: ExperienciaPrevia;
  criancasEmCasa: CriancasEmCasa;
  outrosPets: OutrosPets;
  perfilCompanheiro: PerfilCompanheiro;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchResultItemDto {
  petId: string;
  nome: string;
  especie: string;
  raca: string | null;
  porte: string;
  sexo: string;
  idadeMeses: number;
  castrado: boolean;
  vacinado: boolean;
  temperamento: string | null;
  fotosUrls: string[];
  score: number;
}

export interface MatchResultResponseDto {
  adotanteId: string;
  questionario: QuestionarioMatchResponseDto;
  resultados: MatchResultItemDto[];
  totalPetsAnalisados: number;
  geradoEm: Date;
}

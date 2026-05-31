import { DomainException } from "@shared/domain/exceptions/domain.exception";

// ── Tipos das respostas ───────────────────────────────────────────────────────

/** Moradia do adotante */
export type TipoMoradia =
  | "casa_quintal_grande"
  | "casa_quintal_pequeno"
  | "apartamento"
  | "apartamento_lazer";

/** Disponibilidade de tempo / rotina */
export type Disponibilidade =
  | "fica_em_casa"
  | "sai_almoco"
  | "passa_dia_fora"
  | "viaja_frequentemente";

/** Experiência prévia com animais */
export type ExperienciaPrevia =
  | "sim_tem_experiencia"
  | "sim_faz_tempo"
  | "nunca_quer_aprender"
  | "primeiro_pet_familia";

/** Faixa etária das crianças em casa */
export type CriancasEmCasa =
  | "bebe"          // 0–3 anos
  | "crianca_pequena" // 4–10 anos
  | "crianca_maior"   // 11+ anos
  | "nao";

/** Outros pets presentes */
export type OutrosPets = "cao" | "gato" | "outros" | "nao";

/** Perfil de companheiro desejado */
export type PerfilCompanheiro =
  | "tranquilo"
  | "energetico"
  | "carinhoso"
  | "inteligente";

export interface QuestionarioMatchProps {
  id?: string;
  adotanteId: string;
  tipoMoradia: TipoMoradia;
  disponibilidade: Disponibilidade;
  experienciaPrevia: ExperienciaPrevia;
  criancasEmCasa: CriancasEmCasa;
  outrosPets: OutrosPets;
  perfilCompanheiro: PerfilCompanheiro;
  createdAt?: Date;
  updatedAt?: Date;
}

export class QuestionarioMatch {
  private readonly _id?: string;
  private _adotanteId!: string;
  private _tipoMoradia!: TipoMoradia;
  private _disponibilidade!: Disponibilidade;
  private _experienciaPrevia!: ExperienciaPrevia;
  private _criancasEmCasa!: CriancasEmCasa;
  private _outrosPets!: OutrosPets;
  private _perfilCompanheiro!: PerfilCompanheiro;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string | undefined { return this._id; }
  get adotanteId(): string { return this._adotanteId; }
  get tipoMoradia(): TipoMoradia { return this._tipoMoradia; }
  get disponibilidade(): Disponibilidade { return this._disponibilidade; }
  get experienciaPrevia(): ExperienciaPrevia { return this._experienciaPrevia; }
  get criancasEmCasa(): CriancasEmCasa { return this._criancasEmCasa; }
  get outrosPets(): OutrosPets { return this._outrosPets; }
  get perfilCompanheiro(): PerfilCompanheiro { return this._perfilCompanheiro; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  // ── Builders ───────────────────────────────────────────────────────────────

  withTipoMoradia(v: TipoMoradia): this { this._tipoMoradia = v; return this; }
  withDisponibilidade(v: Disponibilidade): this { this._disponibilidade = v; return this; }
  withExperienciaPrevia(v: ExperienciaPrevia): this { this._experienciaPrevia = v; return this; }
  withCriancasEmCasa(v: CriancasEmCasa): this { this._criancasEmCasa = v; return this; }
  withOutrosPets(v: OutrosPets): this { this._outrosPets = v; return this; }
  withPerfilCompanheiro(v: PerfilCompanheiro): this { this._perfilCompanheiro = v; return this; }

  touch(date: Date): this { this._updatedAt = date; return this; }

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(props: Omit<QuestionarioMatchProps, "id" | "createdAt" | "updatedAt">): QuestionarioMatch {
    if (!props.adotanteId) {
      throw new DomainException("adotanteId é obrigatório para o questionário de match.");
    }

    const now = new Date();
    const entity = new QuestionarioMatch(undefined, now, now);
    entity._adotanteId = props.adotanteId;
    entity._tipoMoradia = props.tipoMoradia;
    entity._disponibilidade = props.disponibilidade;
    entity._experienciaPrevia = props.experienciaPrevia;
    entity._criancasEmCasa = props.criancasEmCasa;
    entity._outrosPets = props.outrosPets;
    entity._perfilCompanheiro = props.perfilCompanheiro;
    return entity;
  }

  static restore(props: QuestionarioMatchProps): QuestionarioMatch {
    const entity = new QuestionarioMatch(props.id, props.createdAt, props.updatedAt);
    entity._adotanteId = props.adotanteId;
    entity._tipoMoradia = props.tipoMoradia;
    entity._disponibilidade = props.disponibilidade;
    entity._experienciaPrevia = props.experienciaPrevia;
    entity._criancasEmCasa = props.criancasEmCasa;
    entity._outrosPets = props.outrosPets;
    entity._perfilCompanheiro = props.perfilCompanheiro;
    return entity;
  }
}

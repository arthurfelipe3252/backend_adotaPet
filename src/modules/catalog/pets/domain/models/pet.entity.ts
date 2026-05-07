export type Especie = "cao" | "gato" | "outro";
export type Porte = "pequeno" | "medio" | "grande";
export type Sexo = "macho" | "femea";
export type PetStatus = "disponivel" | "em_processo" | "adotado";

export interface PetProps {
  id?: string;
  protetorId: string;
  nome: string;
  especie: Especie;
  raca?: string | null;
  porte: Porte;
  sexo: Sexo;
  idadeMeses: number;
  castrado: boolean;
  vacinado: boolean;
  descricao?: string | null;
  temperamento?: string | null;
  status: PetStatus;
  fotosUrls?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Pet {
  private readonly _id?: string;
  private _protetorId: string;
  private _nome: string;
  private _especie: Especie;
  private _raca?: string | null;
  private _porte: Porte;
  private _sexo: Sexo;
  private _idadeMeses: number;
  private _castrado: boolean;
  private _vacinado: boolean;
  private _descricao?: string | null;
  private _temperamento?: string | null;
  private _status: PetStatus;
  private _fotosUrls?: string[] | null;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined { return this._id; }
  get protetorId(): string { return this._protetorId; }
  get nome(): string { return this._nome; }
  get especie(): Especie { return this._especie; }
  get raca(): string | null | undefined { return this._raca; }
  get porte(): Porte { return this._porte; }
  get sexo(): Sexo { return this._sexo; }
  get idadeMeses(): number { return this._idadeMeses; }
  get castrado(): boolean { return this._castrado; }
  get vacinado(): boolean { return this._vacinado; }
  get descricao(): string | null | undefined { return this._descricao; }
  get temperamento(): string | null | undefined { return this._temperamento; }
  get status(): PetStatus { return this._status; }
  get fotosUrls(): string[] | null | undefined { return this._fotosUrls; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  withNome(nome: string): this { this._nome = nome; return this; }
  withEspecie(especie: Especie): this { this._especie = especie; return this; }
  withRaca(raca: string | null): this { this._raca = raca; return this; }
  withPorte(porte: Porte): this { this._porte = porte; return this; }
  withSexo(sexo: Sexo): this { this._sexo = sexo; return this; }
  withIdadeMeses(idadeMeses: number): this { this._idadeMeses = idadeMeses; return this; }
  withCastrado(castrado: boolean): this { this._castrado = castrado; return this; }
  withVacinado(vacinado: boolean): this { this._vacinado = vacinado; return this; }
  withDescricao(descricao: string | null): this { this._descricao = descricao; return this; }
  withTemperamento(temperamento: string | null): this { this._temperamento = temperamento; return this; }
  withStatus(status: PetStatus): this { this._status = status; return this; }
  withFotosUrls(fotosUrls: string[] | null): this { this._fotosUrls = fotosUrls; return this; }

  static restore(props?: PetProps | null): Pet | null {
    if (!props) return null;
    const entity = new Pet(props.id, props.createdAt, props.updatedAt);
    entity._protetorId = props.protetorId;
    entity._nome = props.nome;
    entity._especie = props.especie;
    entity._raca = props.raca;
    entity._porte = props.porte;
    entity._sexo = props.sexo;
    entity._idadeMeses = props.idadeMeses;
    entity._castrado = props.castrado;
    entity._vacinado = props.vacinado;
    entity._descricao = props.descricao;
    entity._temperamento = props.temperamento;
    entity._status = props.status;
    entity._fotosUrls = props.fotosUrls;
    return entity;
  }

  static create(props: Omit<PetProps, "id" | "createdAt" | "updatedAt" | "status">): Pet {
    const now = new Date();
    return Pet.restore({
      ...props,
      status: "disponivel",
      createdAt: now,
      updatedAt: now,
    })!;
  }
}

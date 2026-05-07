import type { Especie, Porte, Sexo, PetStatus } from "../../domain/models/pet.entity";

export interface CreatePetDto {
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
  fotosUrls?: string[] | null;
}

export interface UpdatePetDto extends Partial<Omit<CreatePetDto, "protetorId">> {
  status?: PetStatus;
  fotosUrls?: string[] | null;
}

export interface PetResponseDto {
  id: string;
  protetorId: string;
  nome: string;
  especie: Especie;
  raca: string | null;
  porte: Porte;
  sexo: Sexo;
  idadeMeses: number;
  castrado: boolean;
  vacinado: boolean;
  descricao: string | null;
  temperamento: string | null;
  status: PetStatus;
  fotosUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

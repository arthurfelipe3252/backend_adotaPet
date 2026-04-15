import type { Especie, Porte, Sexo, PetStatus } from "@catalog/pets/domain/models/pet.entity";

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
}

export interface UpdatePetDto extends Partial<Omit<CreatePetDto, "protetorId">> {
  status?: PetStatus;
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
  createdAt: Date;
  updatedAt: Date;
}

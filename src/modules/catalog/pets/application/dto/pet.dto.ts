import type {
  Especie,
  Porte,
  Sexo,
  PetStatus,
} from '../../domain/models/pet.entity';

/**
 * Body do POST /pets. O `protetorId` NÃO está aqui de propósito: é
 * resolvido a partir do JWT no service. Aceitar do cliente permitiria
 * que um protetor criasse pet em nome de outro.
 */
export interface CreatePetDto {
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

export interface UpdatePetDto extends Partial<CreatePetDto> {
  status?: PetStatus;
  fotosUrls?: string[] | null;
}

export interface ProfileSummary {
  id: string;
  nome: string;
}

export interface PetResponseDto {
  id: string;
  protetorId: string;
  /**
   * Summary (id + nome) do protetor/ong dono — populado pelo service
   * via batch lookup. Nulo se o protetor foi excluído.
   */
  protetor: ProfileSummary | null;
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

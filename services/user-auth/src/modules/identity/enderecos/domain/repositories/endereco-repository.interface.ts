import type { Endereco } from '../models/endereco.entity';

export const ENDERECO_REPOSITORY = Symbol('ENDERECO_REPOSITORY');

export interface EnderecoRepository {
  create(endereco: Endereco): Promise<Endereco>;
  update(endereco: Endereco): Promise<void>;
  findById(id: string): Promise<Endereco | null>;
}

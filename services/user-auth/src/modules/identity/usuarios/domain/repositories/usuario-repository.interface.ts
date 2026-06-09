import type { PaginationParams } from '@shared/infra/hateoas';
import type { Usuario } from '../models/usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface UsuarioRepository {
  create(usuario: Usuario): Promise<void>;
  update(usuario: Usuario): Promise<void>;
  deactivate(id: string): Promise<void>;
  findAll(): Promise<Usuario[]>;
  findAllPaginated(params: PaginationParams): Promise<{ rows: Usuario[]; total: number }>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
}

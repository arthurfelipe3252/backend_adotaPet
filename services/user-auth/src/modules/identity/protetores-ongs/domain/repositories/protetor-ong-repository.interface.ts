import type { PaginationParams } from '@shared/infra/hateoas';
import type { ProtetorOng } from '../models/protetor-ong.entity';

export const PROTETOR_ONG_REPOSITORY = Symbol('PROTETOR_ONG_REPOSITORY');

export interface ProtetorOngRepository {
  create(protetor: ProtetorOng): Promise<void>;
  update(protetor: ProtetorOng): Promise<void>;
  findAll(): Promise<ProtetorOng[]>;
  findAllPaginated(params: PaginationParams): Promise<{ rows: ProtetorOng[]; total: number }>;
  findById(id: string): Promise<ProtetorOng | null>;
  findByUsuarioId(usuarioId: string): Promise<ProtetorOng | null>;
}

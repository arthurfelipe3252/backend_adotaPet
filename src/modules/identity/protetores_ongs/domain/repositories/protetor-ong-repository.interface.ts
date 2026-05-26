import type { DbExecutor } from '@shared/infra/database/types';
import { ProtetorOng } from '@identity/protetores_ongs/domain/models/protetor-ong.entity';

export const PROTETOR_ONG_REPOSITORY = Symbol('PROTETOR_ONG_REPOSITORY');

export interface ProtetorOngRepository {
  /**
   * Insere um novo protetor/ONG e retorna a entidade com id gerado.
   * Lança ConflictException se cpfCnpj ou usuario_id já existirem.
   */
  criar(protetor: ProtetorOng, executor?: DbExecutor): Promise<ProtetorOng>;

  buscarPorCpfCnpj(cpfCnpj: string): Promise<ProtetorOng | null>;

  buscarPorUsuarioId(usuarioId: string): Promise<ProtetorOng | null>;

  /**
   * Atualiza os campos mutáveis (descricao, telefoneContato, foto,
   * documento comprobatório, vínculo de endereço) e seta updated_at = now.
   * NÃO permite alterar cpfCnpj nem usuario_id (identidade).
   */
  atualizar(protetor: ProtetorOng, executor?: DbExecutor): Promise<ProtetorOng>;
}

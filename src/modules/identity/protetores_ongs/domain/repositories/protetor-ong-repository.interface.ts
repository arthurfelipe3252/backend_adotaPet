import type { DbExecutor } from '@shared/infra/database/types';
import { ProtetorOng } from '@identity/protetores_ongs/domain/models/protetor-ong.entity';

export const PROTETOR_ONG_REPOSITORY = Symbol('PROTETOR_ONG_REPOSITORY');

/**
 * Projeção mínima de um protetor/ONG para exibição em listas (responses
 * de outros contextos: pets, adoptions, chat, etc.). Não inclui
 * `imagemBase64` (blob pesado).
 */
export interface ProtetorOngSummary {
  id: string;
  nome: string;
}

export interface ProtetorOngRepository {
  /**
   * Insere um novo protetor/ONG e retorna a entidade com id gerado.
   * Lança ConflictException se cpfCnpj ou usuario_id já existirem.
   */
  criar(protetor: ProtetorOng, executor?: DbExecutor): Promise<ProtetorOng>;

  buscarPorCpfCnpj(cpfCnpj: string): Promise<ProtetorOng | null>;

  buscarPorUsuarioId(usuarioId: string): Promise<ProtetorOng | null>;

  /**
   * Busca summaries (id + nome) em batch a partir dos ids de protetores.
   * Faz JOIN com `usuarios` pra trazer o nome. Retorna [] se ids vier
   * vazio; itens não encontrados são omitidos.
   */
  findSummariesByIds(ids: string[]): Promise<ProtetorOngSummary[]>;

  /**
   * Atualiza os campos mutáveis (descricao, telefoneContato, foto,
   * documento comprobatório, vínculo de endereço) e seta updated_at = now.
   * NÃO permite alterar cpfCnpj nem usuario_id (identidade).
   */
  atualizar(protetor: ProtetorOng, executor?: DbExecutor): Promise<ProtetorOng>;
}

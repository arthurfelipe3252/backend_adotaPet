import type { DbExecutor } from '@shared/infra/database/types';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';

export const ADOTANTE_REPOSITORY = Symbol('ADOTANTE_REPOSITORY');

/**
 * Projeção mínima de um adotante para exibição em listas (responses de
 * outros contextos: adoptions, chat, etc.). Não inclui `imagemBase64`
 * porque o blob pode ter MBs — quem precisa da foto chama um endpoint
 * dedicado de perfil.
 */
export interface AdotanteSummary {
  id: string;
  nome: string;
}

export interface AdotanteRepository {
  /**
   * Insere um novo adotante e retorna a entidade com id gerado.
   * Lança ConflictException se cpf ou usuario_id já estiverem em uso.
   *
   * @param executor Opcional. Repositório usa a transação ativa quando
   *                 fornecida (cadastro atômico).
   */
  criar(adotante: Adotante, executor?: DbExecutor): Promise<Adotante>;

  buscarPorCpf(cpf: string): Promise<Adotante | null>;

  buscarPorUsuarioId(usuarioId: string): Promise<Adotante | null>;

  /**
   * Busca summaries (id + nome) em batch a partir dos ids de adotantes.
   * Faz JOIN com `usuarios` pra trazer o nome. Retorna [] se ids vier
   * vazio; itens não encontrados são simplesmente omitidos.
   */
  findSummariesByIds(ids: string[]): Promise<AdotanteSummary[]>;

  /**
   * Atualiza os campos mutáveis (foto, vínculo de endereço) e seta
   * updated_at = now. Não permite alterar cpf nem usuario_id (identidade).
   */
  atualizar(adotante: Adotante, executor?: DbExecutor): Promise<Adotante>;
}

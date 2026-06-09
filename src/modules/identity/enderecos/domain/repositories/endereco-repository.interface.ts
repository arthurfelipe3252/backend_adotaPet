import type { DbExecutor } from '@shared/infra/database/types';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';

export const ENDERECO_REPOSITORY = Symbol('ENDERECO_REPOSITORY');

export interface EnderecoRepository {
  /**
   * Insere um novo endereço e retorna a entidade com id gerado.
   *
   * @param executor Opcional. Quando o caller já abriu uma transação
   *                 (cadastro atômico de adotante/protetor), passe `tx`.
   */
  criar(endereco: Endereco, executor?: DbExecutor): Promise<Endereco>;

  buscarPorId(id: string): Promise<Endereco | null>;

  /**
   * Atualiza um endereço in-place pelo id. Mantém o `id` da linha — a
   * tabela tem UNIQUE constraint em `endereco_id` nas filhas, e atualizar
   * in-place evita ter que mexer no FK do registro pai.
   */
  atualizar(endereco: Endereco, executor?: DbExecutor): Promise<Endereco>;

  /**
   * Apaga o endereço. Usado quando o usuário desvincula (envia
   * `endereco: null` no PATCH /me) — após desvincular, o endereço
   * fica órfão e é apagado para não acumular linhas mortas.
   */
  deletar(id: string, executor?: DbExecutor): Promise<void>;
}

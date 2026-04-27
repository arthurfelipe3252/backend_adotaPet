import type { DbExecutor } from '@shared/infra/database/types';
import { Adotante } from '@identity/adotantes/domain/models/adotante.entity';

export const ADOTANTE_REPOSITORY = Symbol('ADOTANTE_REPOSITORY');

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
   * Atualiza os campos mutáveis (foto, vínculo de endereço) e seta
   * updated_at = now. Não permite alterar cpf nem usuario_id (identidade).
   */
  atualizar(adotante: Adotante, executor?: DbExecutor): Promise<Adotante>;
}

/**
 * Contrato de leitura agregada do bounded context @catalog para o dashboard
 * de reports. A implementação atual lê direto da tabela `pets` (violação
 * temporária da regra de cross-context). Quando o @reports ganhar banco
 * próprio populado via consumer RabbitMQ, esta interface não muda — só
 * troca-se a implementação por uma que leia do schema `reports.*`.
 */

export const PETS_REPORTING = Symbol('PETS_REPORTING');

export interface PetStatusCounts {
  disponivel: number;
  emProcesso: number;
  adotado: number;
  total: number;
}

export interface StalePetRow {
  id: string;
  nome: string;
  especie: string;
  porte: string;
  status: string;
  createdAt: Date;
}

export interface PetSummaryRow {
  id: string;
  nome: string;
  especie: string;
  porte: string;
  status: string;
}

export interface PetsReporting {
  /** Conta pets do protetor agrupados por status. Statuses ausentes retornam 0. */
  countByStatus(protetorId: string): Promise<PetStatusCounts>;

  /**
   * Pets disponíveis sem nenhuma solicitação nos últimos `daysWithoutRequest`
   * dias (inclui pets que nunca tiveram solicitação). Ordem cronológica
   * crescente — os mais antigos no topo (problema mais grave).
   */
  findStalePets(
    protetorId: string,
    daysWithoutRequest: number,
  ): Promise<StalePetRow[]>;

  /**
   * Resumo dos pets cujos ids são passados. Usado para enriquecer o
   * resultado de `topRequestedPets` (que só tem petId + total).
   * Retorna array vazio se `ids` for vazio.
   */
  findByIds(ids: string[]): Promise<PetSummaryRow[]>;
}

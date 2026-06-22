/**
 * Contrato de leitura agregada do bounded context @chat para o dashboard.
 * Ver header em pets-reporting.port.ts para racional.
 */

export const CHAT_REPORTING = Symbol('CHAT_REPORTING');

export interface ChatReporting {
  /** Quantidade de conversas com `is_active=true` do protetor. */
  countActiveConversations(protetorId: string): Promise<number>;

  /**
   * Quantidade de mensagens não lidas nas conversas do protetor cujo
   * remetente NÃO seja o próprio protetor (ou seja: mensagens enviadas
   * pelo adotante que ainda não foram marcadas como lidas).
   */
  countUnreadMessagesForProtetor(protetorId: string): Promise<number>;
}

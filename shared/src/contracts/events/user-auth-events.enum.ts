export enum UserAuthExchangeName {
  USER_CREATED = 'user-auth.users.created.exchange',
  USER_UPDATED = 'user-auth.users.updated.exchange',
  USER_DELETED = 'user-auth.users.deleted.exchange',
}

export enum UserAuthRoutingKey {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
}

/**
 * Resumo de perfil publicado pelo user-auth em user.created/user.updated.
 * `id` é o id do PERFIL (adotantes.id ou protetores_ongs.id) — o mesmo usado
 * como adopterId/protetorId/senderId nos outros serviços. Consumido por
 * catalog/adoption/chat pra popular os resumos `{id, nome}` / `{id, nome, tipo}`.
 */
export interface UserAuthProfilePayload {
  id: string;
  nome: string;
  tipo: string; // 'adotante' | 'protetor' | 'ong'
}

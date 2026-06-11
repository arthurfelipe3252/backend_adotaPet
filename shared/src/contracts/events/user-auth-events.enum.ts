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

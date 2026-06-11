export enum CatalogExchangeName {
  PET_CREATED = 'catalog.pets.created.exchange',
  PET_UPDATED = 'catalog.pets.updated.exchange',
  PET_DELETED = 'catalog.pets.deleted.exchange',
}

export enum CatalogRoutingKey {
  PET_CREATED = 'pet.created',
  PET_UPDATED = 'pet.updated',
  PET_DELETED = 'pet.deleted',
}

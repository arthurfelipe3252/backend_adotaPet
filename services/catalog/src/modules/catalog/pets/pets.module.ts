import { Module } from '@nestjs/common';
import { PetService } from './application/services/pet.service';
import { PetMessagingService } from './application/services/pet-messaging.service';
import { DrizzlePetRepository } from './infra/repositories/drizzle-pet.repository';
import { PetsController } from './infra/controllers/pets.controller';
import { PET_REPOSITORY } from './domain/repositories/pet-repository.interface';
import { DrizzleProfileRepository } from '@catalog/profiles/infra/repositories/drizzle-profile.repository';
import { PROFILE_REPOSITORY } from '@catalog/profiles/domain/repositories/profile-repository.interface';
import { UserAuthEventConsumer } from '@catalog/profiles/infra/consumers/user-auth-event-consumer.service';
import { AdoptionEventConsumer } from './infra/consumers/adoption-event-consumer.service';

@Module({
  controllers: [PetsController],
  providers: [
    PetService,
    PetMessagingService,
    DrizzlePetRepository,
    {
      provide: PET_REPOSITORY,
      useExisting: DrizzlePetRepository,
    },
    // Réplica de perfis (alimentada por eventos do user-auth) → popula pet.protetor
    DrizzleProfileRepository,
    {
      provide: PROFILE_REPOSITORY,
      useExisting: DrizzleProfileRepository,
    },
    UserAuthEventConsumer,
    // Consome eventos do serviço de adoção → atualiza status do pet para 'adotado'
    AdoptionEventConsumer,
  ],
  exports: [PetService, PET_REPOSITORY, DrizzlePetRepository],
})
export class PetsModule {}
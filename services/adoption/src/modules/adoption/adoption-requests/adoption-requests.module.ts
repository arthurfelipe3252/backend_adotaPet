import { Module } from '@nestjs/common';
import { AdoptionRequestService } from '@adoption/adoption-requests/application/services/adoption-request.service';
import { AdoptionMessagingService } from '@adoption/adoption-requests/application/services/adoption-messaging.service';
import { AdoptionRequestsController } from '@adoption/adoption-requests/infra/controllers/adoption-requests.controller';
import { DrizzleAdoptionRequestRepository } from '@adoption/adoption-requests/infra/repositories/drizzle-adoption-request.repository';
import { ADOPTION_REQUEST_REPOSITORY } from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';
import { DrizzleAdoptionPetRepository } from '@adoption/pets/infra/repositories/drizzle-adoption-pet.repository';
import { ADOPTION_PET_REPOSITORY } from '@adoption/pets/domain/repositories/adoption-pet-repository.interface';
import { CatalogPetConsumer } from '@adoption/pets/infra/consumers/catalog-pet-consumer.service';
import { DrizzleProfileRepository } from '@adoption/profiles/infra/repositories/drizzle-profile.repository';
import { PROFILE_REPOSITORY } from '@adoption/profiles/domain/repositories/profile-repository.interface';
import { UserAuthEventConsumer } from '@adoption/profiles/infra/consumers/user-auth-event-consumer.service';

@Module({
  controllers: [AdoptionRequestsController],
  providers: [
    AdoptionRequestService,
    AdoptionMessagingService,
    DrizzleAdoptionRequestRepository,
    {
      provide: ADOPTION_REQUEST_REPOSITORY,
      useExisting: DrizzleAdoptionRequestRepository,
    },
    // Réplica local de pets (alimentada por eventos do catalog) — resolve protetorId
    DrizzleAdoptionPetRepository,
    {
      provide: ADOPTION_PET_REPOSITORY,
      useExisting: DrizzleAdoptionPetRepository,
    },
    CatalogPetConsumer,
    // Réplica de perfis (eventos do user-auth) → popula adopter/protetor
    DrizzleProfileRepository,
    {
      provide: PROFILE_REPOSITORY,
      useExisting: DrizzleProfileRepository,
    },
    UserAuthEventConsumer,
  ],
  exports: [ADOPTION_REQUEST_REPOSITORY],
})
export class AdoptionRequestsModule {}

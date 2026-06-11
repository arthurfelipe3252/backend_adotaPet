import { Module } from '@nestjs/common';
import { PetService } from './application/services/pet.service';
import { PetMessagingService } from './application/services/pet-messaging.service';
import { DrizzlePetRepository } from './infra/repositories/drizzle-pet.repository';
import { PetsController } from './infra/controllers/pets.controller';
import { PET_REPOSITORY } from './domain/repositories/pet-repository.interface';

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
  ],
  exports: [PetService, PET_REPOSITORY, DrizzlePetRepository],
})
export class PetsModule {}

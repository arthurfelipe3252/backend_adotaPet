import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { PetService } from './application/services/pet.service';
import { DrizzlePetRepository } from './infra/repositories/drizzle-pet.repository';
import { PetsController } from './infra/controllers/pets.controller';
import { PET_REPOSITORY } from './domain/repositories/pet-repository.interface';

@Module({
  imports: [SharedModule],
  controllers: [PetsController],
  providers: [
    PetService,
    DrizzlePetRepository,
    {
      provide: PET_REPOSITORY,
      useExisting: DrizzlePetRepository,
    },
  ],
  exports: [PetService, PET_REPOSITORY, DrizzlePetRepository],
})
export class PetsModule {}

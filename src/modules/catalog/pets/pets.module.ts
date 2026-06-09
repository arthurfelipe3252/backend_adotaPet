import { Module } from '@nestjs/common';
import { ProtetoresOngsModule } from '@identity/protetores_ongs/protetores-ongs.module';
import { SharedModule } from '@shared/shared.module';
import { PetService } from './application/services/pet.service';
import { DrizzlePetRepository } from './infra/repositories/drizzle-pet.repository';
import { PetsController } from './infra/controllers/pets.controller';
import { PET_REPOSITORY } from './domain/repositories/pet-repository.interface';

@Module({
  // ProtetoresOngsModule é importado pra que o PetService consiga
  // resolver `protetorId` a partir do `usuarioId` do JWT.
  imports: [SharedModule, ProtetoresOngsModule],
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

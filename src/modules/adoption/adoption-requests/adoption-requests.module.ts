import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { AdoptionRequestService } from '@adoption/adoption-requests/application/services/adoption-request.service';
import { AdoptionRequestsController } from '@adoption/adoption-requests/infra/controllers/adoption-requests.controller';
import { DrizzleAdoptionRequestRepository } from '@adoption/adoption-requests/infra/repositories/drizzle-adoption-request.repository';
import { ADOPTION_REQUEST_REPOSITORY } from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';
import { AdotantesModule } from '@identity/adotantes/adotantes.module';
import { ProtetoresOngsModule } from '@identity/protetores_ongs/protetores-ongs.module';
import { PetsModule } from '@catalog/pets/pets.module';

@Module({
  // AdotantesModule, ProtetoresOngsModule, PetsModule são importados pra
  // que o service consiga resolver adopterId/protetorId a partir do JWT
  // e validar dono do pet.
  imports: [SharedModule, AdotantesModule, ProtetoresOngsModule, PetsModule],
  controllers: [AdoptionRequestsController],
  providers: [
    AdoptionRequestService,
    DrizzleAdoptionRequestRepository,
    {
      provide: ADOPTION_REQUEST_REPOSITORY,
      useExisting: DrizzleAdoptionRequestRepository,
    },
  ],
  exports: [ADOPTION_REQUEST_REPOSITORY],
})
export class AdoptionRequestsModule {}

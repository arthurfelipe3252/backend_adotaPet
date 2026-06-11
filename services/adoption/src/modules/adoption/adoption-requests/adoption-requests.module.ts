import { Module } from '@nestjs/common';
import { AdoptionRequestService } from '@adoption/adoption-requests/application/services/adoption-request.service';
import { AdoptionMessagingService } from '@adoption/adoption-requests/application/services/adoption-messaging.service';
import { AdoptionRequestsController } from '@adoption/adoption-requests/infra/controllers/adoption-requests.controller';
import { DrizzleAdoptionRequestRepository } from '@adoption/adoption-requests/infra/repositories/drizzle-adoption-request.repository';
import { ADOPTION_REQUEST_REPOSITORY } from '@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface';

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
  ],
  exports: [ADOPTION_REQUEST_REPOSITORY],
})
export class AdoptionRequestsModule {}

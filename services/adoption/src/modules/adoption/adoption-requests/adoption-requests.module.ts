import { Module } from '@nestjs/common';
import { AdoptionRequestsController } from './infra/controllers/adoption-requests.controller';
import { AdoptionRequestService } from './application/services/adoption-request.service';
import { AdoptionRequestMessagingService } from './application/services/adoption-request-messaging.service';
import { AdoptionMessageConsumerService } from './application/services/adoption-message-consumer.service';
import { DrizzleAdoptionRequestRepository } from './infra/repositories/drizzle-adoption-request.repository';
import { DrizzlePetLocalRepository } from './infra/repositories/drizzle-pet-local.repository';
import { ADOPTION_REQUEST_REPOSITORY } from './domain/repositories/adoption-request-repository.interface';

@Module({
  controllers: [AdoptionRequestsController],
  providers: [
    AdoptionRequestService,
    AdoptionRequestMessagingService,
    AdoptionMessageConsumerService,
    DrizzleAdoptionRequestRepository,
    { provide: ADOPTION_REQUEST_REPOSITORY, useExisting: DrizzleAdoptionRequestRepository },
    DrizzlePetLocalRepository,
  ],
})
export class AdoptionRequestsModule {}

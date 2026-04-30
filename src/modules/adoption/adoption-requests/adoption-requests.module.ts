import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { AdoptionRequestService } from "@adoption/adoption-requests/application/services/adoption-request.service";
import { AdoptionRequestsController } from "@adoption/adoption-requests/infra/controllers/adoption-requests.controller";
import { DrizzleAdoptionRequestRepository } from "@adoption/adoption-requests/infra/repositories/drizzle-adoption-request.repository";
import { ADOPTION_REQUEST_REPOSITORY } from "@adoption/adoption-requests/domain/repositories/adoption-request-repository.interface";

@Module({
  imports: [SharedModule],
  controllers: [AdoptionRequestsController],
  providers: [
    AdoptionRequestService,
    DrizzleAdoptionRequestRepository,
    {
      provide: ADOPTION_REQUEST_REPOSITORY,
      useExisting: DrizzleAdoptionRequestRepository,
    },
  ],
})
export class AdoptionRequestsModule {}

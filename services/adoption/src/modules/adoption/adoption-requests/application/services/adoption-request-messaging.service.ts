import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { AdoptionExchangeName, AdoptionRoutingKey } from '@shared/contracts/events/adoption-events.enum';
import type { AdoptionRequestResponseDto } from '../dto/adoption-request.dto';

@Injectable()
export class AdoptionRequestMessagingService implements OnApplicationBootstrap {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.messagingService.assertExchange(AdoptionExchangeName.REQUEST_CREATED),
      this.messagingService.assertExchange(AdoptionExchangeName.REQUEST_UPDATED),
    ]);
  }

  async publishRequestCreated(request: AdoptionRequestResponseDto): Promise<void> {
    await this.messagingService.publish(
      AdoptionExchangeName.REQUEST_CREATED,
      AdoptionRoutingKey.REQUEST_CREATED,
      request,
    );
  }

  async publishRequestUpdated(request: AdoptionRequestResponseDto): Promise<void> {
    await this.messagingService.publish(
      AdoptionExchangeName.REQUEST_UPDATED,
      AdoptionRoutingKey.REQUEST_UPDATED,
      request,
    );
  }
}

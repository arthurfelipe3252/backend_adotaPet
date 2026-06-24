import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { AdoptionExchangeName, AdoptionRoutingKey } from '@shared/contracts/events/adoption-events.enum';

@Injectable()
export class AdoptionMessagingService implements OnApplicationBootstrap {
  constructor(private readonly sharedMessagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.sharedMessagingService.assertExchange(AdoptionExchangeName.REQUEST_CREATED),
      this.sharedMessagingService.assertExchange(AdoptionExchangeName.REQUEST_UPDATED),
      this.sharedMessagingService.assertExchange(AdoptionExchangeName.REQUEST_DELETED),
    ]);
  }

  async publishRequestCreated(payload: {
    id: string;
    petId: string;
    protetorId: string;
    adopterId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }): Promise<void> {
    await this.sharedMessagingService.publish(
      AdoptionExchangeName.REQUEST_CREATED,
      AdoptionRoutingKey.REQUEST_CREATED,
      payload,
    );
  }

  async publishRequestUpdated(payload: {
    id: string;
    petId: string;
    status: string;
    adopterId?: string;
    protetorId?: string;
    updatedAt?: string;
  }): Promise<void> {
    await this.sharedMessagingService.publish(
      AdoptionExchangeName.REQUEST_UPDATED,
      AdoptionRoutingKey.REQUEST_UPDATED,
      payload,
    );
  }

  async publishRequestDeleted(id: string): Promise<void> {
    await this.sharedMessagingService.publish(
      AdoptionExchangeName.REQUEST_DELETED,
      AdoptionRoutingKey.REQUEST_DELETED,
      { id },
    );
  }
}
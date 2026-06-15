import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  CatalogExchangeName,
  CatalogRoutingKey,
  type CatalogPetPayload,
} from '@shared/contracts/events/catalog-events.enum';

@Injectable()
export class PetMessagingService implements OnApplicationBootstrap {
  constructor(private readonly sharedMessagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.sharedMessagingService.assertExchange(CatalogExchangeName.PET_CREATED),
      this.sharedMessagingService.assertExchange(CatalogExchangeName.PET_UPDATED),
      this.sharedMessagingService.assertExchange(CatalogExchangeName.PET_DELETED),
    ]);
  }

  async publishPetCreated(payload: CatalogPetPayload): Promise<void> {
    await this.sharedMessagingService.publish(
      CatalogExchangeName.PET_CREATED,
      CatalogRoutingKey.PET_CREATED,
      payload,
    );
  }

  async publishPetUpdated(payload: CatalogPetPayload): Promise<void> {
    await this.sharedMessagingService.publish(
      CatalogExchangeName.PET_UPDATED,
      CatalogRoutingKey.PET_UPDATED,
      payload,
    );
  }

  async publishPetDeleted(id: string): Promise<void> {
    await this.sharedMessagingService.publish(
      CatalogExchangeName.PET_DELETED,
      CatalogRoutingKey.PET_DELETED,
      { id },
    );
  }
}

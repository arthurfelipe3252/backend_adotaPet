import { Injectable } from '@nestjs/common';
import { type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { CatalogExchangeName, CatalogRoutingKey } from '@shared/contracts/events/catalog-events.enum';
import type { PetResponseDto } from '../dto/pet.dto';

@Injectable()
export class PetMessagingService implements OnApplicationBootstrap {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.messagingService.assertExchange(CatalogExchangeName.PET_CREATED),
      this.messagingService.assertExchange(CatalogExchangeName.PET_UPDATED),
      this.messagingService.assertExchange(CatalogExchangeName.PET_DELETED),
    ]);
  }

  async publishPetCreated(pet: PetResponseDto): Promise<void> {
    await this.messagingService.publish(
      CatalogExchangeName.PET_CREATED,
      CatalogRoutingKey.PET_CREATED,
      pet,
    );
  }

  async publishPetUpdated(pet: PetResponseDto): Promise<void> {
    await this.messagingService.publish(
      CatalogExchangeName.PET_UPDATED,
      CatalogRoutingKey.PET_UPDATED,
      pet,
    );
  }

  async publishPetDeleted(petId: string): Promise<void> {
    await this.messagingService.publish(
      CatalogExchangeName.PET_DELETED,
      CatalogRoutingKey.PET_DELETED,
      { id: petId },
    );
  }
}

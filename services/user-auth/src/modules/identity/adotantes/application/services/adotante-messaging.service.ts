import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { IdentityExchangeName, IdentityRoutingKey } from '@shared/contracts/events/identity-events.enum';
import type { AdotanteResponseDto } from '../dto/adotante.dto';

@Injectable()
export class AdotanteMessagingService implements OnApplicationBootstrap {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.messagingService.assertExchange(IdentityExchangeName.ADOTANTE_CREATED),
      this.messagingService.assertExchange(IdentityExchangeName.ADOTANTE_UPDATED),
    ]);
  }

  async publishAdotanteCreated(adotante: AdotanteResponseDto): Promise<void> {
    await this.messagingService.publish(
      IdentityExchangeName.ADOTANTE_CREATED,
      IdentityRoutingKey.ADOTANTE_CREATED,
      adotante,
    );
  }

  async publishAdotanteUpdated(adotante: AdotanteResponseDto): Promise<void> {
    await this.messagingService.publish(
      IdentityExchangeName.ADOTANTE_UPDATED,
      IdentityRoutingKey.ADOTANTE_UPDATED,
      adotante,
    );
  }
}

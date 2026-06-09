import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { IdentityExchangeName, IdentityRoutingKey } from '@shared/contracts/events/identity-events.enum';
import type { ProtetorOngResponseDto } from '../dto/protetor-ong.dto';

@Injectable()
export class ProtetorOngMessagingService implements OnApplicationBootstrap {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.messagingService.assertExchange(IdentityExchangeName.PROTETOR_CREATED),
      this.messagingService.assertExchange(IdentityExchangeName.PROTETOR_UPDATED),
    ]);
  }

  async publishProtetorCreated(protetor: ProtetorOngResponseDto): Promise<void> {
    await this.messagingService.publish(
      IdentityExchangeName.PROTETOR_CREATED,
      IdentityRoutingKey.PROTETOR_CREATED,
      protetor,
    );
  }

  async publishProtetorUpdated(protetor: ProtetorOngResponseDto): Promise<void> {
    await this.messagingService.publish(
      IdentityExchangeName.PROTETOR_UPDATED,
      IdentityRoutingKey.PROTETOR_UPDATED,
      protetor,
    );
  }
}

import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  UserAuthExchangeName,
  UserAuthRoutingKey,
  type UserAuthProfilePayload,
} from '@shared/contracts/events/user-auth-events.enum';

@Injectable()
export class UserMessagingService implements OnApplicationBootstrap {
  constructor(private readonly sharedMessagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.sharedMessagingService.assertExchange(UserAuthExchangeName.USER_CREATED),
      this.sharedMessagingService.assertExchange(UserAuthExchangeName.USER_UPDATED),
      this.sharedMessagingService.assertExchange(UserAuthExchangeName.USER_DELETED),
    ]);
  }

  /** Publica o resumo de perfil (id de PERFIL + nome + tipo) na criação. */
  async publishProfileCreated(payload: UserAuthProfilePayload): Promise<void> {
    await this.sharedMessagingService.publish(
      UserAuthExchangeName.USER_CREATED,
      UserAuthRoutingKey.USER_CREATED,
      payload,
    );
  }

  /** Publica o resumo de perfil atualizado (ex.: nome alterado em PATCH /me). */
  async publishProfileUpdated(payload: UserAuthProfilePayload): Promise<void> {
    await this.sharedMessagingService.publish(
      UserAuthExchangeName.USER_UPDATED,
      UserAuthRoutingKey.USER_UPDATED,
      payload,
    );
  }

  async publishUserDeleted(id: string): Promise<void> {
    await this.sharedMessagingService.publish(
      UserAuthExchangeName.USER_DELETED,
      UserAuthRoutingKey.USER_DELETED,
      { id },
    );
  }
}

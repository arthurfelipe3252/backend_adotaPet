import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { IdentityExchangeName, IdentityRoutingKey } from '@shared/contracts/events/identity-events.enum';
import type { UsuarioResponseDto } from '../dto/usuario.dto';

@Injectable()
export class UsuarioMessagingService implements OnApplicationBootstrap {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.messagingService.assertExchange(IdentityExchangeName.USER_CREATED),
      this.messagingService.assertExchange(IdentityExchangeName.USER_UPDATED),
      this.messagingService.assertExchange(IdentityExchangeName.USER_DELETED),
    ]);
  }

  async publishUserCreated(usuario: UsuarioResponseDto): Promise<void> {
    await this.messagingService.publish(
      IdentityExchangeName.USER_CREATED,
      IdentityRoutingKey.USER_CREATED,
      usuario,
    );
  }

  async publishUserUpdated(usuario: UsuarioResponseDto): Promise<void> {
    await this.messagingService.publish(
      IdentityExchangeName.USER_UPDATED,
      IdentityRoutingKey.USER_UPDATED,
      usuario,
    );
  }

  async publishUserDeleted(usuarioId: string): Promise<void> {
    await this.messagingService.publish(
      IdentityExchangeName.USER_DELETED,
      IdentityRoutingKey.USER_DELETED,
      { id: usuarioId },
    );
  }
}

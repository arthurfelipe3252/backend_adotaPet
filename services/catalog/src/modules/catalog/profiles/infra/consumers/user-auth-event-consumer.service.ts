import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { RabbitMQService } from '@shared/infra/messaging/rabbitmq.service';
import {
  UserAuthExchangeName,
  UserAuthRoutingKey,
  type UserAuthProfilePayload,
} from '@shared/contracts/events/user-auth-events.enum';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
} from '@catalog/profiles/domain/repositories/profile-repository.interface';

/**
 * Materializa a réplica local `profiles` a partir dos eventos do user-auth
 * (user.created/user.updated, que carregam o resumo de perfil). Filas próprias
 * do catalog.
 */
@Injectable()
export class UserAuthEventConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserAuthEventConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.consume(UserAuthExchangeName.USER_CREATED, UserAuthRoutingKey.USER_CREATED, 'catalog.service.user-created'),
      this.consume(UserAuthExchangeName.USER_UPDATED, UserAuthRoutingKey.USER_UPDATED, 'catalog.service.user-updated'),
    ]);
  }

  private async consume(exchange: string, routingKey: string, queue: string): Promise<void> {
    await this.rabbitMQ.consume(exchange, routingKey, queue, async (payload) => {
      const p = payload as UserAuthProfilePayload;
      await this.profileRepository.upsert(p);
      this.logger.log(`profiles upsert: ${p.id} (${p.tipo})`);
    });
  }
}

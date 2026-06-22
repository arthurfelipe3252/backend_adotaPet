import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { RabbitMQService } from '@shared/infra/messaging/rabbitmq.service';
import {
  CatalogExchangeName,
  CatalogRoutingKey,
  type CatalogPetPayload,
} from '@shared/contracts/events/catalog-events.enum';
import {
  MATCH_PET_REPOSITORY,
  type MatchPetRepository,
} from '@match/pets/domain/repositories/match-pet-repository.interface';

/**
 * Consome os eventos de pet do catalog e materializa a réplica local match_pets.
 * Filas próprias do match (fan-out: o reports tem as suas), bind nas mesmas
 * exchanges/routing-keys. Idempotente via upsert.
 */
@Injectable()
export class CatalogPetConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogPetConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    @Inject(MATCH_PET_REPOSITORY)
    private readonly matchPetRepository: MatchPetRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.consumePetCreated(),
      this.consumePetUpdated(),
      this.consumePetDeleted(),
    ]);
  }

  private async consumePetCreated(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_CREATED,
      CatalogRoutingKey.PET_CREATED,
      'match.service.pet-created',
      async (payload) => {
        const pet = payload as CatalogPetPayload;
        await this.matchPetRepository.upsert(pet);
        this.logger.log(`match_pets upsert (created): ${pet.id}`);
      },
    );
  }

  private async consumePetUpdated(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_UPDATED,
      CatalogRoutingKey.PET_UPDATED,
      'match.service.pet-updated',
      async (payload) => {
        const pet = payload as CatalogPetPayload;
        await this.matchPetRepository.upsert(pet);
        this.logger.log(`match_pets upsert (updated): ${pet.id}`);
      },
    );
  }

  private async consumePetDeleted(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_DELETED,
      CatalogRoutingKey.PET_DELETED,
      'match.service.pet-deleted',
      async (payload) => {
        const { id } = payload as { id: string };
        await this.matchPetRepository.deleteById(id);
        this.logger.log(`match_pets delete: ${id}`);
      },
    );
  }
}

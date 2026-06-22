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
  ADOPTION_PET_REPOSITORY,
  type AdoptionPetRepository,
} from '@adoption/pets/domain/repositories/adoption-pet-repository.interface';

/**
 * Materializa a réplica local `adoption_pets` a partir dos eventos de pet do
 * catalog. Filas próprias do adoption (fan-out: reports e match têm as suas).
 */
@Injectable()
export class CatalogPetConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogPetConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    @Inject(ADOPTION_PET_REPOSITORY)
    private readonly adoptionPetRepository: AdoptionPetRepository,
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
      'adoption.service.pet-created',
      async (payload) => {
        const pet = payload as CatalogPetPayload;
        await this.adoptionPetRepository.upsert(pet);
        this.logger.log(`adoption_pets upsert (created): ${pet.id}`);
      },
    );
  }

  private async consumePetUpdated(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_UPDATED,
      CatalogRoutingKey.PET_UPDATED,
      'adoption.service.pet-updated',
      async (payload) => {
        const pet = payload as CatalogPetPayload;
        await this.adoptionPetRepository.upsert(pet);
        this.logger.log(`adoption_pets upsert (updated): ${pet.id}`);
      },
    );
  }

  private async consumePetDeleted(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_DELETED,
      CatalogRoutingKey.PET_DELETED,
      'adoption.service.pet-deleted',
      async (payload) => {
        const { id } = payload as { id: string };
        await this.adoptionPetRepository.deleteById(id);
        this.logger.log(`adoption_pets delete: ${id}`);
      },
    );
  }
}

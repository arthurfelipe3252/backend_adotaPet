import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { RabbitMQService } from '@shared/infra/messaging/rabbitmq.service';
import { AdoptionExchangeName, AdoptionRoutingKey } from '@shared/contracts/events/adoption-events.enum';
import {
  PET_REPOSITORY,
  type PetRepository,
} from '@catalog/pets/domain/repositories/pet-repository.interface';

/**
 * Consome eventos do serviço de adoção e mantém o status do pet no catalog
 * sincronizado: quando uma solicitação é aprovada, marca o pet como 'adotado'.
 */
@Injectable()
export class AdoptionEventConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdoptionEventConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    @Inject(PET_REPOSITORY)
    private readonly petRepository: PetRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.rabbitMQ.consume(
      AdoptionExchangeName.REQUEST_UPDATED,
      AdoptionRoutingKey.REQUEST_UPDATED,
      'catalog.service.adoption-request-updated',
      async (payload) => {
        const p = payload as { petId: string; status: string };
        if (p.status !== 'approved') return;

        const pet = await this.petRepository.findById(p.petId);
        if (!pet) {
          this.logger.warn(`AdoptionEventConsumer: pet ${p.petId} não encontrado no catalog`);
          return;
        }

        pet.withStatus('adotado');
        await this.petRepository.update(pet);
        this.logger.log(`Pet ${p.petId} marcado como adotado no catalog`);
      },
    );
  }
}
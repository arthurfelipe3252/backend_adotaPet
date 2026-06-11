import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { RabbitMQService } from '@shared/infra/messaging/rabbitmq.service';
import {
  AdoptionExchangeName,
  AdoptionRoutingKey,
} from '@shared/contracts/events/adoption-events.enum';
import { ConversationService } from '@chat/conversations/application/services/conversation.service';

interface AdoptionRequestUpdatedEvent {
  id: string;
  status: string;
  adopterId?: string;
  protetorId?: string;
}

@Injectable()
export class AdoptionEventConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdoptionEventConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly conversationService: ConversationService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.rabbitMQ.consume(
      AdoptionExchangeName.REQUEST_UPDATED,
      AdoptionRoutingKey.REQUEST_UPDATED,
      'chat.service.adoption-request-updated',
      async (payload) => {
        const event = payload as AdoptionRequestUpdatedEvent;
        if (event.status !== 'approved') return;
        if (!event.adopterId || !event.protetorId) return;

        this.logger.log(`Auto-creating conversation for adoption ${event.id}`);
        await this.conversationService.createInternal({
          adoptionRequestId: event.id,
          adopterId: event.adopterId,
          protetorId: event.protetorId,
        });
      },
    );
  }
}

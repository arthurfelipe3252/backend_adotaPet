import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import type { Channel } from 'amqplib';
import { RabbitMQService } from '@shared/infra/messaging/rabbitmq.service';
import { CatalogExchangeName, CatalogRoutingKey } from '@shared/contracts/events/catalog-events.enum';
import { DrizzlePetLocalRepository } from '@adoption/adoption-requests/infra/repositories/drizzle-pet-local.repository';

@Injectable()
export class AdoptionMessageConsumerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(AdoptionMessageConsumerService.name);
  private channel?: Channel;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly petLocalRepository: DrizzlePetLocalRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.channel = await this.rabbitMQService.createChannel();

    await Promise.all([
      this.registerConsumer({
        queueName: 'adoption.catalog-pets.created.queue',
        exchangeName: CatalogExchangeName.PET_CREATED,
        routingKey: CatalogRoutingKey.PET_CREATED,
        handler: (payload) => this.handlePetUpsert(payload),
      }),
      this.registerConsumer({
        queueName: 'adoption.catalog-pets.updated.queue',
        exchangeName: CatalogExchangeName.PET_UPDATED,
        routingKey: CatalogRoutingKey.PET_UPDATED,
        handler: (payload) => this.handlePetUpsert(payload),
      }),
      this.registerConsumer({
        queueName: 'adoption.catalog-pets.deleted.queue',
        exchangeName: CatalogExchangeName.PET_DELETED,
        routingKey: CatalogRoutingKey.PET_DELETED,
        handler: (payload) => this.handlePetDeleted(payload),
      }),
    ]);

    this.logger.log('Consumers de eventos de pets registrados');
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
  }

  private async registerConsumer(params: {
    queueName: string;
    exchangeName: string;
    routingKey: string;
    handler: (payload: unknown) => Promise<void>;
  }): Promise<void> {
    await this.channel!.assertExchange(params.exchangeName, 'direct', { durable: true });
    await this.channel!.assertQueue(params.queueName, { durable: true });
    await this.channel!.bindQueue(params.queueName, params.exchangeName, params.routingKey);

    await this.channel!.consume(params.queueName, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString()) as unknown;
        await params.handler(payload);
        this.channel!.ack(msg);
      } catch (error) {
        this.logger.error(`Erro ao processar mensagem da fila ${params.queueName}`, error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  private async handlePetUpsert(payload: unknown): Promise<void> {
    const pet = payload as { id: string; nome: string; status: string; protetorId: string };
    await this.petLocalRepository.upsert({
      externalId: pet.id,
      nome: pet.nome,
      status: pet.status,
      protetorId: pet.protetorId,
    });
    this.logger.debug(`Pet sincronizado localmente: ${pet.id}`);
  }

  private async handlePetDeleted(payload: unknown): Promise<void> {
    const { id } = payload as { id: string };
    await this.petLocalRepository.deleteByExternalId(id);
    this.logger.debug(`Pet removido do cache local: ${id}`);
  }
}

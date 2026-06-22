import { Injectable } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class SharedMessagingService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async assertExchange(exchangeName: string): Promise<void> {
    const channel = this.rabbitMQService.getChannel();
    await channel.assertExchange(exchangeName, 'direct', { durable: true });
  }

  async publish(exchangeName: string, routingKey: string, payload: unknown): Promise<void> {
    const channel = this.rabbitMQService.getChannel();
    channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }
}

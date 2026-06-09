import { Injectable } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class SharedMessagingService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async assertExchange(name: string, type = 'direct'): Promise<void> {
    await this.rabbitMQService.assertExchange(name, type);
  }

  async publish(exchange: string, routingKey: string, payload: unknown): Promise<void> {
    await this.rabbitMQService.publish(exchange, routingKey, payload);
  }
}

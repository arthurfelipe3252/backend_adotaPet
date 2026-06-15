import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection?: amqplib.ChannelModel;
  private channel?: amqplib.Channel;
  private isAlive = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async connect(): Promise<void> {
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');
    const connection = await amqplib.connect(url);
    this.connection = connection;
    this.channel = await connection.createChannel();
    this.isAlive = true;
    // Mantém o sinal de readiness fiel: se a conexão cair, isConnected() vira
    // false e o health check do serviço passa a responder 503.
    connection.on('close', () => {
      this.isAlive = false;
    });
    connection.on('error', () => {
      this.isAlive = false;
    });
    this.logger.log('RabbitMQ connected');
  }

  getChannel(): amqplib.Channel {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized.');
    return this.channel;
  }

  /** Sinal de prontidão usado pelo HealthController (readiness probe). */
  isConnected(): boolean {
    return this.isAlive;
  }

  async createChannel(): Promise<amqplib.Channel> {
    if (!this.connection) throw new Error('RabbitMQ connection not initialized.');
    return this.connection.createChannel();
  }

  async consume(
    exchange: string,
    routingKey: string,
    queueName: string,
    handler: (payload: unknown) => Promise<void>,
  ): Promise<void> {
    const channel = await this.createChannel();
    channel.prefetch(1);
    await channel.assertExchange(exchange, 'direct', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchange, routingKey);
    channel.consume(queueName, async (msg) => {
      if (!msg) return;
      try {
        const payload: unknown = JSON.parse(msg.content.toString());
        await handler(payload);
        channel.ack(msg);
      } catch (err) {
        this.logger.error(`Consumer error on ${queueName}:`, err);
        channel.nack(msg, false, false);
      }
    });
    this.logger.log(`Consumer registered: ${queueName} ← ${exchange}/${routingKey}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

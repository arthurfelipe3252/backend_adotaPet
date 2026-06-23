import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection?: amqplib.ChannelModel;
  private channel?: amqplib.Channel;
  private isAlive = false;
  private destroyed = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const connection = await amqplib.connect(url);
        this.connection = connection;
        this.channel = await connection.createChannel();
        this.isAlive = true;
        connection.on('close', () => {
          if (this.destroyed) return;
          this.isAlive = false;
          this.logger.warn('RabbitMQ connection closed — reconnecting...');
          setTimeout(() => this.connectWithRetry(), RETRY_DELAY_MS);
        });
        connection.on('error', (err) => {
          this.isAlive = false;
          this.logger.error('RabbitMQ connection error:', err.message);
        });
        this.logger.log('RabbitMQ connected');
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `RabbitMQ connection attempt ${attempt}/${MAX_RETRIES} failed: ${message}`,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }
    throw new Error(`RabbitMQ: failed to connect after ${MAX_RETRIES} attempts`);
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
    this.destroyed = true;
    await this.channel?.close();
    await this.connection?.close();
  }
}

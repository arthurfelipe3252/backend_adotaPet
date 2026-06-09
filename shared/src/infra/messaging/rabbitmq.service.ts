import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection!: amqplib.ChannelModel;
  private channel!: amqplib.Channel;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();
    this.logger.log('RabbitMQ conectado');
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignora erros ao fechar
    }
  }

  getChannel(): amqplib.Channel {
    return this.channel;
  }

  async createChannel(): Promise<amqplib.Channel> {
    return this.connection.createChannel();
  }

  async assertExchange(name: string, type = 'direct'): Promise<void> {
    await this.channel.assertExchange(name, type, { durable: true });
  }

  async publish(exchange: string, routingKey: string, payload: unknown): Promise<void> {
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
  }
}

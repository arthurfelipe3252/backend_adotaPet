import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SharedAuthModule } from './infra/auth/shared-auth.module';
import { DrizzleService } from './infra/database/drizzle.service';
import { HateoasInterceptor } from './infra/hateoas/hateoas.interceptor';
import { DomainExceptionFilter } from './infra/http/filters/domain-exception.filter';
import { HealthController } from './infra/http/health/health.controller';
import { RabbitMQService } from './infra/messaging/rabbitmq.service';
import { SharedMessagingService } from './infra/messaging/shared-messaging.service';

@Global()
@Module({
  imports: [SharedAuthModule],
  controllers: [HealthController],
  providers: [
    DrizzleService,
    RabbitMQService,
    SharedMessagingService,
    { provide: APP_INTERCEPTOR, useClass: HateoasInterceptor },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
  exports: [SharedAuthModule, DrizzleService, RabbitMQService, SharedMessagingService],
})
export class SharedModule {}

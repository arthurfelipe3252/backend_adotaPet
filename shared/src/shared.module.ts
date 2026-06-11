import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SharedAuthModule } from './infra/auth/shared-auth.module';
import { DrizzleService } from './infra/database/drizzle.service';
import { HateoasInterceptor } from './infra/hateoas/hateoas.interceptor';
import { RabbitMQService } from './infra/messaging/rabbitmq.service';
import { SharedMessagingService } from './infra/messaging/shared-messaging.service';

@Global()
@Module({
  imports: [SharedAuthModule],
  providers: [
    DrizzleService,
    RabbitMQService,
    SharedMessagingService,
    { provide: APP_INTERCEPTOR, useClass: HateoasInterceptor },
  ],
  exports: [SharedAuthModule, DrizzleService, RabbitMQService, SharedMessagingService],
})
export class SharedModule {}

import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { ChatExchangeName, ChatRoutingKey } from '@shared/contracts/events/chat-events.enum';

@Injectable()
export class ChatMessagingService implements OnApplicationBootstrap {
  constructor(private readonly sharedMessaging: SharedMessagingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.sharedMessaging.assertExchange(ChatExchangeName.CONVERSATION_CREATED),
      this.sharedMessaging.assertExchange(ChatExchangeName.MESSAGE_CREATED),
    ]);
  }

  async publishConversationCreated(payload: {
    id: string;
    adopterId: string;
    protetorId: string;
    adoptionRequestId: string;
  }): Promise<void> {
    await this.sharedMessaging.publish(
      ChatExchangeName.CONVERSATION_CREATED,
      ChatRoutingKey.CONVERSATION_CREATED,
      payload,
    );
  }

  async publishMessageCreated(payload: {
    id: string;
    conversationId: string;
    senderId: string;
    isRead: boolean;
  }): Promise<void> {
    await this.sharedMessaging.publish(
      ChatExchangeName.MESSAGE_CREATED,
      ChatRoutingKey.MESSAGE_CREATED,
      payload,
    );
  }
}

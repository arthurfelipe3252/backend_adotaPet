import { Module } from '@nestjs/common';
import { ConversationService } from '@chat/conversations/application/services/conversation.service';
import { MessageService } from '@chat/conversations/application/services/message.service';
import { ConversationsController } from '@chat/conversations/infra/controllers/conversations.controller';
import { MessagesController } from '@chat/conversations/infra/controllers/messages.controller';
import { DrizzleConversationRepository } from '@chat/conversations/infra/repositories/drizzle-conversation.repository';
import { DrizzleMessageRepository } from '@chat/conversations/infra/repositories/drizzle-message.repository';
import { CONVERSATION_REPOSITORY } from '@chat/conversations/domain/repositories/conversation-repository.interface';
import { MESSAGE_REPOSITORY } from '@chat/conversations/domain/repositories/message-repository.interface';
import { ChatMessagingService } from '@chat/conversations/infra/messaging/chat-messaging.service';
import { AdoptionEventConsumer } from '@chat/conversations/infra/consumers/adoption-event-consumer.service';

@Module({
  controllers: [ConversationsController, MessagesController],
  providers: [
    ConversationService,
    MessageService,
    ChatMessagingService,
    AdoptionEventConsumer,
    DrizzleConversationRepository,
    DrizzleMessageRepository,
    { provide: CONVERSATION_REPOSITORY, useExisting: DrizzleConversationRepository },
    { provide: MESSAGE_REPOSITORY, useExisting: DrizzleMessageRepository },
  ],
})
export class ConversationsModule {}

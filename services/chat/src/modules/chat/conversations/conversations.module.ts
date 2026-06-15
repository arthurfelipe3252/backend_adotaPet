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
import { DrizzleProfileRepository } from '@chat/profiles/infra/repositories/drizzle-profile.repository';
import { PROFILE_REPOSITORY } from '@chat/profiles/domain/repositories/profile-repository.interface';
import { UserAuthEventConsumer } from '@chat/profiles/infra/consumers/user-auth-event-consumer.service';

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
    // Réplica de perfis (eventos do user-auth) → popula adopter/protetor/sender
    DrizzleProfileRepository,
    { provide: PROFILE_REPOSITORY, useExisting: DrizzleProfileRepository },
    UserAuthEventConsumer,
  ],
})
export class ConversationsModule {}

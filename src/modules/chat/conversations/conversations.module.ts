import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { ConversationService } from '@chat/conversations/application/services/conversation.service';
import { MessageService } from '@chat/conversations/application/services/message.service';
import { ConversationsController } from '@chat/conversations/infra/controllers/conversations.controller';
import { MessagesController } from '@chat/conversations/infra/controllers/messages.controller';
import { DrizzleConversationRepository } from '@chat/conversations/infra/repositories/drizzle-conversation.repository';
import { DrizzleMessageRepository } from '@chat/conversations/infra/repositories/drizzle-message.repository';
import { CONVERSATION_REPOSITORY } from '@chat/conversations/domain/repositories/conversation-repository.interface';
import { MESSAGE_REPOSITORY } from '@chat/conversations/domain/repositories/message-repository.interface';

@Module({
  imports: [SharedModule],
  controllers: [ConversationsController, MessagesController],
  providers: [
    ConversationService,
    MessageService,
    DrizzleConversationRepository,
    DrizzleMessageRepository,
    {
      provide: CONVERSATION_REPOSITORY,
      useExisting: DrizzleConversationRepository,
    },
    {
      provide: MESSAGE_REPOSITORY,
      useExisting: DrizzleMessageRepository,
    },
  ],
})
export class ConversationsModule {}

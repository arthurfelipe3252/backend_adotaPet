import { Module } from '@nestjs/common';
import { ConversationsController } from './infra/controllers/conversations.controller';
import { MessagesController } from './infra/controllers/messages.controller';
import { ConversationService } from './application/services/conversation.service';
import { MessageService } from './application/services/message.service';
import { DrizzleConversationRepository } from './infra/repositories/drizzle-conversation.repository';
import { DrizzleMessageRepository } from './infra/repositories/drizzle-message.repository';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation-repository.interface';
import { MESSAGE_REPOSITORY } from './domain/repositories/message-repository.interface';

@Module({
  controllers: [ConversationsController, MessagesController],
  providers: [
    ConversationService,
    MessageService,
    DrizzleConversationRepository,
    { provide: CONVERSATION_REPOSITORY, useExisting: DrizzleConversationRepository },
    DrizzleMessageRepository,
    { provide: MESSAGE_REPOSITORY, useExisting: DrizzleMessageRepository },
  ],
})
export class ConversationsModule {}

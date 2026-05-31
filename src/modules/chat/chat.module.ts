import { Module } from '@nestjs/common';
import { ConversationsModule } from '@chat/conversations/conversations.module';

@Module({
  imports: [ConversationsModule],
})
export class ChatModule {}

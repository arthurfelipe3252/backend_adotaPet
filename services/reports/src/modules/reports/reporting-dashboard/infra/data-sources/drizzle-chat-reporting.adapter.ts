import { Injectable } from '@nestjs/common';
import { and, eq, ne, sql } from 'drizzle-orm';
import { reportConversationsSchema as conversationsSchema } from '@reports/reporting-dashboard/infra/schemas/conversations.schema';
import { reportMessagesSchema as messagesSchema } from '@reports/reporting-dashboard/infra/schemas/messages.schema';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { ChatReporting } from '@reports/reporting-dashboard/domain/ports/chat-reporting.port';

/**
 * ⚠️ CROSS-CONTEXT TEMPORÁRIO  — ver header em drizzle-pets-reporting.adapter.ts.
 */
@Injectable()
export class DrizzleChatReportingAdapter implements ChatReporting {
  constructor(private readonly drizzle: DrizzleService) {}

  async countActiveConversations(protetorId: string): Promise<number> {
    const [row] = await this.drizzle.db
      .select({ total: sql<number>`count(*)::int` })
      .from(conversationsSchema)
      .where(
        and(
          eq(conversationsSchema.protetorId, protetorId),
          eq(conversationsSchema.isActive, true),
        ),
      );

    return row?.total ?? 0;
  }

  async countUnreadMessagesForProtetor(protetorId: string): Promise<number> {
    // Mensagens não lidas onde sender NÃO é o próprio protetor. Por
    // contrato do @chat, sender_id é igual ao adopter_id OU ao protetor_id
    // da conversa — filtrar por sender != protetorId pega exatamente as
    // mensagens enviadas pelo adotante.
    const [row] = await this.drizzle.db
      .select({ total: sql<number>`count(*)::int` })
      .from(messagesSchema)
      .innerJoin(
        conversationsSchema,
        eq(conversationsSchema.id, messagesSchema.conversationId),
      )
      .where(
        and(
          eq(conversationsSchema.protetorId, protetorId),
          eq(messagesSchema.isRead, false),
          ne(messagesSchema.senderId, protetorId),
        ),
      );

    return row?.total ?? 0;
  }
}

import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { RabbitMQService } from '@shared/infra/messaging/rabbitmq.service';
import { CatalogExchangeName, CatalogRoutingKey } from '@shared/contracts/events/catalog-events.enum';
import { AdoptionExchangeName, AdoptionRoutingKey } from '@shared/contracts/events/adoption-events.enum';
import { ChatExchangeName, ChatRoutingKey } from '@shared/contracts/events/chat-events.enum';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { reportPetsSchema } from '@reports/reporting-dashboard/infra/schemas/pets.schema';
import { reportAdoptionRequestsSchema } from '@reports/reporting-dashboard/infra/schemas/adoption-requests.schema';
import { reportConversationsSchema } from '@reports/reporting-dashboard/infra/schemas/conversations.schema';
import { reportMessagesSchema } from '@reports/reporting-dashboard/infra/schemas/messages.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ReportsConsumerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReportsConsumerService.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly drizzle: DrizzleService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      this.consumePetCreated(),
      this.consumePetUpdated(),
      this.consumePetDeleted(),
      this.consumeAdoptionCreated(),
      this.consumeAdoptionUpdated(),
      this.consumeConversationCreated(),
      this.consumeMessageCreated(),
    ]);
  }

  private async consumePetCreated(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_CREATED,
      CatalogRoutingKey.PET_CREATED,
      'reports.service.pet-created',
      async (payload) => {
        const p = payload as {
          id: string; protetorId: string; nome: string;
          especie: string; porte: string; status: string; createdAt: string; updatedAt: string;
        };
        await this.drizzle.db.insert(reportPetsSchema).values({
          id: p.id, protetorId: p.protetorId, nome: p.nome,
          especie: p.especie, porte: p.porte, status: p.status,
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt),
        }).onConflictDoNothing();
        this.logger.log(`report_pets upsert: ${p.id}`);
      },
    );
  }

  private async consumePetUpdated(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_UPDATED,
      CatalogRoutingKey.PET_UPDATED,
      'reports.service.pet-updated',
      async (payload) => {
        const p = payload as {
          id: string; nome?: string; especie?: string;
          porte?: string; status?: string; updatedAt: string;
        };
        await this.drizzle.db.update(reportPetsSchema)
          .set({
            ...(p.nome && { nome: p.nome }),
            ...(p.especie && { especie: p.especie }),
            ...(p.porte && { porte: p.porte }),
            ...(p.status && { status: p.status }),
            updatedAt: new Date(p.updatedAt),
          })
          .where(eq(reportPetsSchema.id, p.id));
      },
    );
  }

  private async consumePetDeleted(): Promise<void> {
    await this.rabbitMQ.consume(
      CatalogExchangeName.PET_DELETED,
      CatalogRoutingKey.PET_DELETED,
      'reports.service.pet-deleted',
      async (payload) => {
        const p = payload as { id: string };
        await this.drizzle.db.delete(reportPetsSchema).where(eq(reportPetsSchema.id, p.id));
      },
    );
  }

  private async consumeAdoptionCreated(): Promise<void> {
    await this.rabbitMQ.consume(
      AdoptionExchangeName.REQUEST_CREATED,
      AdoptionRoutingKey.REQUEST_CREATED,
      'reports.service.adoption-created',
      async (payload) => {
        const p = payload as {
          id: string; petId: string; protetorId?: string;
          adopterId: string; status: string; createdAt: string; updatedAt: string;
        };
        await this.drizzle.db.insert(reportAdoptionRequestsSchema).values({
          id: p.id, petId: p.petId, protetorId: p.protetorId ?? null,
          adopterId: p.adopterId, status: p.status,
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt),
        }).onConflictDoNothing();
      },
    );
  }

  private async consumeAdoptionUpdated(): Promise<void> {
    await this.rabbitMQ.consume(
      AdoptionExchangeName.REQUEST_UPDATED,
      AdoptionRoutingKey.REQUEST_UPDATED,
      'reports.service.adoption-updated',
      async (payload) => {
        const p = payload as {
          id: string; status: string; protetorId?: string; updatedAt?: string;
        };
        await this.drizzle.db.update(reportAdoptionRequestsSchema)
          .set({
            status: p.status,
            ...(p.protetorId && { protetorId: p.protetorId }),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          })
          .where(eq(reportAdoptionRequestsSchema.id, p.id));
      },
    );
  }

  private async consumeConversationCreated(): Promise<void> {
    await this.rabbitMQ.consume(
      ChatExchangeName.CONVERSATION_CREATED,
      ChatRoutingKey.CONVERSATION_CREATED,
      'reports.service.conversation-created',
      async (payload) => {
        const p = payload as {
          id: string; adopterId: string; protetorId: string;
        };
        await this.drizzle.db.insert(reportConversationsSchema).values({
          id: p.id, adopterId: p.adopterId, protetorId: p.protetorId,
          createdAt: new Date(), updatedAt: new Date(),
        }).onConflictDoNothing();
      },
    );
  }

  private async consumeMessageCreated(): Promise<void> {
    await this.rabbitMQ.consume(
      ChatExchangeName.MESSAGE_CREATED,
      ChatRoutingKey.MESSAGE_CREATED,
      'reports.service.message-created',
      async (payload) => {
        const p = payload as {
          id: string; conversationId: string; senderId: string; isRead: boolean;
        };
        await this.drizzle.db.insert(reportMessagesSchema).values({
          id: p.id, conversationId: p.conversationId,
          senderId: p.senderId, isRead: p.isRead,
          createdAt: new Date(),
        }).onConflictDoNothing();
      },
    );
  }
}

import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { Public } from '@shared/infra/decorators/public.decorator';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { RabbitMQService } from '@shared/infra/messaging/rabbitmq.service';

/**
 * Readiness probe usado pelo HEALTHCHECK do Docker / orquestrador.
 *
 * Diferente do monolito (que fazia só liveness), aqui checamos as duas
 * dependências de runtime de todo serviço: Postgres (SELECT 1) e RabbitMQ
 * (conexão viva). Como cada serviço é independente, falhar o readiness afeta
 * só aquele container — o orquestrador para de rotear tráfego pra ele.
 *
 * Marcado @Public() pra fazer bypass do APP_GUARD global (JWT).
 * Registrado via SharedModule, então existe nos 6 serviços em /v1/health.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly rabbitMQ: RabbitMQService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Readiness probe — checa Postgres e RabbitMQ' })
  @ApiResponse({ status: 200, description: 'Serviço pronto' })
  @ApiResponse({ status: 503, description: 'Dependência indisponível' })
  async check() {
    const db = await this.checkDb();
    const rabbitmq = this.rabbitMQ.isConnected();

    const body = {
      status: db && rabbitmq ? 'ok' : 'degraded',
      db: db ? 'up' : 'down',
      rabbitmq: rabbitmq ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };

    if (body.status !== 'ok') {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.drizzle.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }
}

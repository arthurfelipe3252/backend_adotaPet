import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@identity/usuarios/infra/decorators/public.decorator';

/**
 * Endpoint de liveness usado pelo HEALTHCHECK do Docker e pelo Easypanel.
 * Não toca no banco — é só um sinal de "o processo Node está respondendo".
 *
 * Para readiness completo (ex: ping no Postgres) bastaria injetar o
 * DrizzleService e fazer `select 1`, mas isso muda a semântica do
 * healthcheck — abrir falha aqui derrubaria a app inteira em qualquer
 * blip de rede do banco.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness probe — usado pelo Docker/Easypanel' })
  @ApiResponse({ status: 200, description: 'Aplicação em pé' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

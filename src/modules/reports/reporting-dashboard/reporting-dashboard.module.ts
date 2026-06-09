import { Module } from '@nestjs/common';
import { ProtetoresOngsModule } from '@identity/protetores_ongs/protetores-ongs.module';
import { UsuariosModule } from '@identity/usuarios/usuarios.module';
import { SharedModule } from '@shared/shared.module';
import { DashboardService } from '@reports/reporting-dashboard/application/services/dashboard.service';
import { ADOPTION_REPORTING } from '@reports/reporting-dashboard/domain/ports/adoption-reporting.port';
import { CHAT_REPORTING } from '@reports/reporting-dashboard/domain/ports/chat-reporting.port';
import { PETS_REPORTING } from '@reports/reporting-dashboard/domain/ports/pets-reporting.port';
import { ReportsController } from '@reports/reporting-dashboard/infra/controllers/reports.controller';
import { DrizzleAdoptionReportingAdapter } from '@reports/reporting-dashboard/infra/data-sources/drizzle-adoption-reporting.adapter';
import { DrizzleChatReportingAdapter } from '@reports/reporting-dashboard/infra/data-sources/drizzle-chat-reporting.adapter';
import { DrizzlePetsReportingAdapter } from '@reports/reporting-dashboard/infra/data-sources/drizzle-pets-reporting.adapter';

/**
 * Sub-módulo do bounded context @reports. Hoje contém apenas o dashboard
 * das ONGs/protetores. Se futuramente houver outros relatórios (admin,
 * adotantes, export CSV etc.), cada um vira um novo sub-módulo ao lado.
 *
 * Imports:
 * - SharedModule:          DrizzleService global (acesso ao banco)
 * - UsuariosModule:        JwtAuthGuard + JwtStrategy + Passport (proteção da rota)
 * - ProtetoresOngsModule:  PROTETOR_ONG_REPOSITORY (resolução de protetorId
 *                          a partir do usuarioId do JWT)
 *
 * Acoplamento intencional do MVP — `infra/data-sources/` também viola a
 * regra de bounded context lendo direto das tabelas de @catalog, @adoption
 * e @chat. Será substituído por consumer RabbitMQ em fase futura.
 */
@Module({
  imports: [SharedModule, UsuariosModule, ProtetoresOngsModule],
  controllers: [ReportsController],
  providers: [
    DashboardService,
    DrizzlePetsReportingAdapter,
    { provide: PETS_REPORTING, useExisting: DrizzlePetsReportingAdapter },
    DrizzleAdoptionReportingAdapter,
    {
      provide: ADOPTION_REPORTING,
      useExisting: DrizzleAdoptionReportingAdapter,
    },
    DrizzleChatReportingAdapter,
    { provide: CHAT_REPORTING, useExisting: DrizzleChatReportingAdapter },
  ],
})
export class ReportingDashboardModule {}

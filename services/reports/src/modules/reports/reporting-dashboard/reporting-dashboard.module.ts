import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { DashboardService } from '@reports/reporting-dashboard/application/services/dashboard.service';
import { ADOPTION_REPORTING } from '@reports/reporting-dashboard/domain/ports/adoption-reporting.port';
import { CHAT_REPORTING } from '@reports/reporting-dashboard/domain/ports/chat-reporting.port';
import { PETS_REPORTING } from '@reports/reporting-dashboard/domain/ports/pets-reporting.port';
import { ReportsController } from '@reports/reporting-dashboard/infra/controllers/reports.controller';
import { DrizzleAdoptionReportingAdapter } from '@reports/reporting-dashboard/infra/data-sources/drizzle-adoption-reporting.adapter';
import { DrizzleChatReportingAdapter } from '@reports/reporting-dashboard/infra/data-sources/drizzle-chat-reporting.adapter';
import { DrizzlePetsReportingAdapter } from '@reports/reporting-dashboard/infra/data-sources/drizzle-pets-reporting.adapter';
import { ReportsConsumerService } from '@reports/reporting-dashboard/infra/consumers/reports-consumer.service';

@Module({
  imports: [SharedModule],
  controllers: [ReportsController],
  providers: [
    DashboardService,
    ReportsConsumerService,
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

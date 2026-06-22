import { Module } from '@nestjs/common';
import { ReportingDashboardModule } from '@reports/reporting-dashboard/reporting-dashboard.module';

/**
 * Módulo agregador do bounded context @reports.
 *
 * Sub-módulos:
 * - reporting-dashboard: home das ONGs/protetores (KPIs + gráficos + listas)
 */
@Module({
  imports: [ReportingDashboardModule],
  exports: [ReportingDashboardModule],
})
export class ReportsModule {}

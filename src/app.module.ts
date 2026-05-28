import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared/shared.module';
import { HealthController } from '@shared/infra/http/health/health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from '@identity/identity.module';
import { AdoptionModule } from '@adoption/adoption.module';
import { MatchModule } from '@match/match.module';
import { ChatModule } from '@chat/chat.module';
import { ReportsModule } from '@reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    CatalogModule,
    IdentityModule,
    AdoptionModule,
    MatchModule,
    ChatModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

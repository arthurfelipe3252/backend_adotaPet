import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared/shared.module';
import { HealthController } from '@shared/infra/http/health/health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from '@identity/identity.module';
import { AdoptionModule } from '@adoption/adoption.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    CatalogModule,
    IdentityModule,
    AdoptionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
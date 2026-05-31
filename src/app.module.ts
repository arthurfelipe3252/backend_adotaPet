import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from '@shared/shared.module';
import { HealthController } from '@shared/infra/http/health/health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from '@identity/identity.module';
import { AdoptionModule } from '@adoption/adoption.module';
import { MatchModule } from '@match/match.module';
import { ChatModule } from '@chat/chat.module';
import { ReportsModule } from '@reports/reports.module';
import { JwtAuthGuard } from '@identity/usuarios/infra/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    // IdentityModule precisa vir antes dos consumidores porque exporta
    // PassportModule/JwtModule/JwtAuthGuard usados pelo APP_GUARD global.
    IdentityModule,
    CatalogModule,
    AdoptionModule,
    MatchModule,
    ChatModule,
    ReportsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guard global: TODO endpoint do sistema exige JWT por default.
    // Endpoints públicos (login, cadastros, health) precisam ser marcados
    // com o decorator `@Public()` para fazer bypass.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

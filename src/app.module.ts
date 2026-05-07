import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared/shared.module';
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
})
export class AppModule {}
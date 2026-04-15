import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared/shared.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from '@identity/identity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    CatalogModule,
    IdentityModule,
  ],
})
export class AppModule {}
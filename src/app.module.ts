import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { IdentityModule } from "@identity/identity.module";
import { SharedModule } from "@shared/shared.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedModule,
    IdentityModule,
  ],
})
export class AppModule {}

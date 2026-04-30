import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SharedModule } from "@shared/shared.module";
import { AdoptionModule } from "@adoption/adoption.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedModule,
    AdoptionModule,
  ],
})
export class AppModule {}

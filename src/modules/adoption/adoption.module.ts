import { Module } from "@nestjs/common";
import { AdoptionRequestsModule } from "@adoption/adoption-requests/adoption-requests.module";

@Module({
  imports: [AdoptionRequestsModule],
})
export class AdoptionModule {}

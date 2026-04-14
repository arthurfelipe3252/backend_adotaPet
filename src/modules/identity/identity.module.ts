import { Module } from "@nestjs/common";
import { UsersModule } from "@identity/users/users.module";

@Module({
  imports: [UsersModule],
})
export class IdentityModule {}
import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { UsersService } from "@identity/users/application/services/users.service";
import { USER_REPOSITORY } from "@identity/users/domain/repositories/user-repository.interface";
import { UsersController } from "@identity/users/infra/controllers/users.controller";
import { DrizzleUserRepository } from "@identity/users/infra/repositories/drizzle-user.repository";

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    DrizzleUserRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: DrizzleUserRepository,
    },
  ],
})
export class UsersModule {}
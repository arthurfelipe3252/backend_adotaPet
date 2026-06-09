import { Module } from '@nestjs/common';
import { UsuariosController } from './infra/controllers/usuarios.controller';
import { AuthController } from './infra/controllers/auth.controller';
import { UsuarioService } from './application/services/usuario.service';
import { AuthService } from './application/services/auth.service';
import { UsuarioMessagingService } from './application/services/usuario-messaging.service';
import { DrizzleUsuarioRepository } from './infra/repositories/drizzle-usuario.repository';
import { DrizzleRefreshTokenRepository } from './infra/repositories/drizzle-refresh-token.repository';
import { BcryptPasswordHasher } from './infra/security/bcrypt-password-hasher';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token-repository.interface';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.interface';

@Module({
  controllers: [UsuariosController, AuthController],
  providers: [
    UsuarioService,
    AuthService,
    UsuarioMessagingService,
    DrizzleUsuarioRepository,
    { provide: USUARIO_REPOSITORY, useExisting: DrizzleUsuarioRepository },
    DrizzleRefreshTokenRepository,
    { provide: REFRESH_TOKEN_REPOSITORY, useExisting: DrizzleRefreshTokenRepository },
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
  ],
  exports: [USUARIO_REPOSITORY, DrizzleUsuarioRepository, PASSWORD_HASHER, BcryptPasswordHasher],
})
export class UsuariosModule {}

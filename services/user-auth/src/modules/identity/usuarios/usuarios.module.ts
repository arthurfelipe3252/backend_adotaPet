import { Module } from '@nestjs/common';
import { AuthService } from '@identity/usuarios/application/services/auth.service';
import { UsuarioService } from '@identity/usuarios/application/services/usuario.service';
import { UserMessagingService } from '@identity/usuarios/application/services/user-messaging.service';
import { PASSWORD_HASHER } from '@identity/usuarios/domain/ports/password-hasher.interface';
import { REFRESH_TOKEN_REPOSITORY } from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import { USUARIO_REPOSITORY } from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import { AuthController } from '@identity/usuarios/infra/controllers/auth.controller';
import { UsuariosController } from '@identity/usuarios/infra/controllers/usuarios.controller';
import { DrizzleRefreshTokenRepository } from '@identity/usuarios/infra/repositories/drizzle-refresh-token.repository';
import { DrizzleUsuarioRepository } from '@identity/usuarios/infra/repositories/drizzle-usuario.repository';
import { BcryptPasswordHasher } from '@identity/usuarios/infra/security/bcrypt-password-hasher';

@Module({
  controllers: [UsuariosController, AuthController],
  providers: [
    UsuarioService,
    AuthService,
    UserMessagingService,
    DrizzleUsuarioRepository,
    { provide: USUARIO_REPOSITORY, useExisting: DrizzleUsuarioRepository },
    DrizzleRefreshTokenRepository,
    { provide: REFRESH_TOKEN_REPOSITORY, useExisting: DrizzleRefreshTokenRepository },
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
  ],
  exports: [
    USUARIO_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    PASSWORD_HASHER,
    UsuarioService,
    AuthService,
  ],
})
export class UsuariosModule {}

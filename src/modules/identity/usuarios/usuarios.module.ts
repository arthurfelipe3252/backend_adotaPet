import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SharedModule } from '@shared/shared.module';
import { AuthService } from '@identity/usuarios/application/services/auth.service';
import { UsuarioService } from '@identity/usuarios/application/services/usuario.service';
import { PASSWORD_HASHER } from '@identity/usuarios/domain/ports/password-hasher.interface';
import { REFRESH_TOKEN_REPOSITORY } from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import { USUARIO_REPOSITORY } from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import { AuthController } from '@identity/usuarios/infra/controllers/auth.controller';
import { UsuariosController } from '@identity/usuarios/infra/controllers/usuarios.controller';
import { JwtAuthGuard } from '@identity/usuarios/infra/guards/jwt-auth.guard';
import { DrizzleRefreshTokenRepository } from '@identity/usuarios/infra/repositories/drizzle-refresh-token.repository';
import { DrizzleUsuarioRepository } from '@identity/usuarios/infra/repositories/drizzle-usuario.repository';
import { BcryptPasswordHasher } from '@identity/usuarios/infra/security/bcrypt-password-hasher';
import { JwtStrategy } from '@identity/usuarios/infra/strategies/jwt.strategy';

/**
 * Módulo único do bounded context Identity (por enquanto).
 *
 * Contém TUDO que diz respeito a usuários e à autenticação deles:
 * - CRUD de usuários (UsuariosController + UsuarioService)
 * - Login / refresh / logout (AuthController + AuthService)
 * - Entidades Usuario e RefreshToken
 * - Repositórios Drizzle de ambos
 * - JwtStrategy + JwtAuthGuard + decorators
 *
 * Não tem forwardRef porque tudo vive aqui dentro — sem ciclo entre módulos.
 *
 * Exports:
 * - JwtAuthGuard, PassportModule, JwtModule: pra futuros sub-módulos do Identity
 *   (adotantes, protetores_ongs etc.) protegerem suas próprias rotas com o mesmo guard.
 * - USUARIO_REPOSITORY, REFRESH_TOKEN_REPOSITORY, PASSWORD_HASHER, services: caso
 *   outros sub-módulos do Identity precisem consultar usuários/sessões.
 */
@Module({
  imports: [
    SharedModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // signOptions intencionalmente omitido — o AuthService passa expiresIn
      // explicitamente em cada chamada de sign() lendo do .env, evitando o
      // problema de tipo do template literal StringValue do jsonwebtoken.
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [UsuariosController, AuthController],
  providers: [
    UsuarioService,
    AuthService,
    JwtStrategy,
    DrizzleUsuarioRepository,
    { provide: USUARIO_REPOSITORY, useExisting: DrizzleUsuarioRepository },
    DrizzleRefreshTokenRepository,
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useExisting: DrizzleRefreshTokenRepository,
    },
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    JwtAuthGuard,
  ],
  exports: [
    USUARIO_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    PASSWORD_HASHER,
    UsuarioService,
    AuthService,
    JwtAuthGuard,
    PassportModule,
    JwtModule,
  ],
})
export class UsuariosModule {}

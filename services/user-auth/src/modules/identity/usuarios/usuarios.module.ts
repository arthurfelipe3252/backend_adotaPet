import { Module } from '@nestjs/common';
import { AuthService } from '@identity/usuarios/application/services/auth.service';
import { ForgotPasswordService } from '@identity/usuarios/application/services/forgot-password.service';
import { UsuarioService } from '@identity/usuarios/application/services/usuario.service';
import { UserMessagingService } from '@identity/usuarios/application/services/user-messaging.service';
import { EMAIL_SENDER } from '@identity/usuarios/domain/ports/email-sender.interface';
import { PASSWORD_HASHER } from '@identity/usuarios/domain/ports/password-hasher.interface';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '@identity/usuarios/domain/repositories/password-reset-token-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import { USUARIO_REPOSITORY } from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import { AuthController } from '@identity/usuarios/infra/controllers/auth.controller';
import { UsuariosController } from '@identity/usuarios/infra/controllers/usuarios.controller';
import { ResendEmailSender } from '@identity/usuarios/infra/email/resend-email-sender';
import { DrizzlePasswordResetTokenRepository } from '@identity/usuarios/infra/repositories/drizzle-password-reset-token.repository';
import { DrizzleRefreshTokenRepository } from '@identity/usuarios/infra/repositories/drizzle-refresh-token.repository';
import { DrizzleUsuarioRepository } from '@identity/usuarios/infra/repositories/drizzle-usuario.repository';
import { BcryptPasswordHasher } from '@identity/usuarios/infra/security/bcrypt-password-hasher';
// Repos de perfil providos localmente (sem importar os módulos — evita ciclo,
// pois Adotantes/ProtetoresOngsModule importam UsuariosModule). Só dependem do
// DrizzleService global. Usados pelo AuthService pra embutir o id de perfil no JWT.
import { ADOTANTE_REPOSITORY } from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import { DrizzleAdotanteRepository } from '@identity/adotantes/infra/repositories/drizzle-adotante.repository';
import { PROTETOR_ONG_REPOSITORY } from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { DrizzleProtetorOngRepository } from '@identity/protetores_ongs/infra/repositories/drizzle-protetor-ong.repository';

@Module({
  controllers: [UsuariosController, AuthController],
  providers: [
    UsuarioService,
    AuthService,
    ForgotPasswordService,
    UserMessagingService,
    DrizzleUsuarioRepository,
    { provide: USUARIO_REPOSITORY, useExisting: DrizzleUsuarioRepository },
    DrizzleRefreshTokenRepository,
    { provide: REFRESH_TOKEN_REPOSITORY, useExisting: DrizzleRefreshTokenRepository },
    DrizzlePasswordResetTokenRepository,
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useExisting: DrizzlePasswordResetTokenRepository,
    },
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    ResendEmailSender,
    { provide: EMAIL_SENDER, useExisting: ResendEmailSender },
    DrizzleAdotanteRepository,
    { provide: ADOTANTE_REPOSITORY, useExisting: DrizzleAdotanteRepository },
    DrizzleProtetorOngRepository,
    { provide: PROTETOR_ONG_REPOSITORY, useExisting: DrizzleProtetorOngRepository },
  ],
  exports: [
    USUARIO_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    PASSWORD_RESET_TOKEN_REPOSITORY,
    PASSWORD_HASHER,
    UsuarioService,
    AuthService,
    ForgotPasswordService,
    UserMessagingService,
  ],
})
export class UsuariosModule {}
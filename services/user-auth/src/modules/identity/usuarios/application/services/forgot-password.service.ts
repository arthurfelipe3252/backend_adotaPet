import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { paraSegundos } from '@shared/utils/duration.util';
import { ForgotPasswordDto } from '@identity/usuarios/application/dto/forgot-password.dto';
import { ResetPasswordDto } from '@identity/usuarios/application/dto/reset-password.dto';
import { PasswordResetToken } from '@identity/usuarios/domain/models/password-reset-token.entity';
import {
  EMAIL_SENDER,
  type EmailSender,
} from '@identity/usuarios/domain/ports/email-sender.interface';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@identity/usuarios/domain/ports/password-hasher.interface';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepository,
} from '@identity/usuarios/domain/repositories/password-reset-token-repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';

/**
 * Service de recuperação de senha (fluxo "esqueci minha senha").
 *
 * Fluxo:
 * 1. requestReset:  usuário informa email → se existir, gera token opaco,
 *    salva o HASH dele com expiração, dispara e-mail com o token em texto
 *    puro no link. Resposta é SEMPRE genérica (mesmo se o email não existir)
 *    para não permitir user enumeration.
 * 2. confirmReset:  usuário envia token + nova senha → valida o hash do
 *    token, troca a senha, marca o token como usado, e revoga todas as
 *    sessões ativas (refresh tokens) por segurança — se alguém mais tinha
 *    acesso à conta, perde a sessão ao trocar a senha.
 *
 * Decisões de segurança (espelham AuthService):
 * - Token é opaco (crypto.randomBytes), não JWT — não precisa ser
 *   autocontido, só precisa ser imprevisível e ter lookup por hash.
 * - SHA-256 no armazenamento (mesma justificativa do RefreshToken: o token
 *   já é random de alta entropia, não precisa de bcrypt).
 * - Token expira em 30 minutos por padrão (configurável via
 *   PASSWORD_RESET_TOKEN_EXPIRES_IN).
 * - Ao emitir um novo token, invalida os anteriores do mesmo usuário —
 *   evita que múltiplos links antigos fiquem ativos simultaneamente.
 */
@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokenRepository: PasswordResetTokenRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
    private readonly configService: ConfigService,
  ) {}

  // ==================================================================
  // POST /users/auth/forgot-password
  // ==================================================================
  async requestReset(dto: ForgotPasswordDto): Promise<void> {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);

    // Mesmo comportamento (sem lançar, sem diferenciar resposta) exista
    // ou não o usuário — evita user enumeration via timing ou status code.
    if (!usuario || !usuario.ativo || !usuario.id) {
      this.logger.debug(
        `Solicitação de recuperação para email não encontrado/inativo: ${dto.email}`,
      );
      return;
    }

    // Invalida tokens anteriores ainda válidos antes de emitir um novo.
    await this.resetTokenRepository.invalidateAllForUser(usuario.id);

    const tokenPlain = randomBytes(32).toString('base64url');
    const tokenHash = this.sha256(tokenPlain);

    const expiresInSeconds = paraSegundos(
      this.configService.get<string>('PASSWORD_RESET_TOKEN_EXPIRES_IN') ??
        '30m',
    );
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const resetToken = PasswordResetToken.create({
      usuarioId: usuario.id,
      tokenHash,
      expiresAt,
    });
    await this.resetTokenRepository.create(resetToken);

    const baseUrl =
      this.configService.get<string>('FRONTEND_RESET_URL') ??
      'http://localhost:3000/reset-password';
    const resetUrl = `${baseUrl}?token=${encodeURIComponent(tokenPlain)}`;

    // Envio é "fire and forget" do ponto de vista do use case: erros de
    // e-mail nunca devem vazar na resposta HTTP (ver ResendEmailSender).
    await this.emailSender.sendPasswordResetEmail({
      to: usuario.email,
      nome: usuario.nome,
      resetUrl,
    });
  }

  // ==================================================================
  // POST /users/auth/reset-password
  // ==================================================================
  async confirmReset(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.sha256(dto.token);
    const stored = await this.resetTokenRepository.findByHash(tokenHash);

    if (!stored || !stored.isValid() || !stored.id) {
      throw new UnauthorizedException(
        'Link de recuperação inválido ou expirado',
      );
    }

    const usuario = await this.usuarioRepository.buscarPorId(
      stored.usuarioId,
    );
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException(
        'Link de recuperação inválido ou expirado',
      );
    }

    const novoHash = await this.passwordHasher.hash(dto.novaSenha);
    usuario.withSenhaHash(novoHash);
    await this.usuarioRepository.atualizar(usuario);

    await this.resetTokenRepository.markAsUsed(stored.id);

    // Por segurança, encerra todas as sessões ativas: se a conta foi
    // comprometida, o invasor perde acesso assim que a senha é trocada.
    await this.refreshTokenRepository.revokeAllForUser(usuario.id!);
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
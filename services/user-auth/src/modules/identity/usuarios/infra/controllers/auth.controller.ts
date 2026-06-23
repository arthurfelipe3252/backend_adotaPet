import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthResponseDto } from '@identity/usuarios/application/dto/auth-response.dto';
import { ForgotPasswordDto } from '@identity/usuarios/application/dto/forgot-password.dto';
import { LoginDto } from '@identity/usuarios/application/dto/login.dto';
import { RefreshTokenDto } from '@identity/usuarios/application/dto/refresh-token.dto';
import { ResetPasswordDto } from '@identity/usuarios/application/dto/reset-password.dto';
import { AuthService } from '@identity/usuarios/application/services/auth.service';
import { ForgotPasswordService } from '@identity/usuarios/application/services/forgot-password.service';
import { LoginMeta } from '@identity/usuarios/application/types/login-meta.type';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import { Public } from '@identity/usuarios/infra/decorators/public.decorator';

@ApiTags('Auth')
@Controller('users/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
  ) {}

  // ----------------------------------------------------------------
  // POST /auth/login
  // ----------------------------------------------------------------
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica com email e senha',
    description:
      'Retorna access token (curta duração) e refresh token (longa duração). ' +
      'Use o access token no header Authorization: Bearer <token>.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({
    status: 401,
    description:
      'Credenciais inválidas (email não existe, senha errada ou conta inativa)',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto, this.extractMeta(request));
  }

  // ----------------------------------------------------------------
  // POST /auth/refresh
  // ----------------------------------------------------------------
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotaciona o par de tokens',
    description:
      'Recebe um refresh token válido, revoga ele e emite um novo par ' +
      '(access + refresh) atomicamente. Tentar reusar o refresh token ' +
      'anterior depois disso retorna 401.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, expirado, revogado ou já usado',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(dto, this.extractMeta(request));
  }

  // ----------------------------------------------------------------
  // POST /auth/logout
  // ----------------------------------------------------------------
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Revoga o refresh token informado',
    description:
      'Operação idempotente. Requer access token válido no header ' +
      '(além do refresh token no body) — comprova que o chamador tem a sessão ativa.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 204, description: 'Logout efetuado' })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente ou inválido',
  })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  // ----------------------------------------------------------------
  // POST /auth/logout-all
  // ----------------------------------------------------------------
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Revoga todos os refresh tokens do usuário',
    description:
      'Encerra todas as sessões ativas em todos os dispositivos. ' +
      'Requer access token válido no header.',
  })
  @ApiResponse({ status: 204, description: 'Todas as sessões encerradas' })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente ou inválido',
  })
  async logoutAll(
    @CurrentUser() autenticado: AuthenticatedUser,
  ): Promise<void> {
    await this.authService.logoutAll(autenticado.id);
  }

  // ----------------------------------------------------------------
  // POST /auth/forgot-password
  // ----------------------------------------------------------------
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Solicita recuperação de senha',
    description:
      'Se o email existir e estiver ativo, envia um link de redefinição ' +
      'por e-mail (válido por 30 minutos). A resposta é SEMPRE 204, exista ' +
      'ou não o email — isso evita que alguém descubra quais emails estão ' +
      'cadastrados (user enumeration).',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 204,
    description: 'Solicitação processada (independente do email existir)',
  })
  @ApiResponse({ status: 400, description: 'Email em formato inválido' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.forgotPasswordService.requestReset(dto);
  }

  // ----------------------------------------------------------------
  // POST /auth/reset-password
  // ----------------------------------------------------------------
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirma a recuperação de senha com o token recebido por e-mail',
    description:
      'Troca a senha do usuário dono do token e revoga todas as sessões ' +
      'ativas (refresh tokens) por segurança.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 204, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, expirado ou já utilizado',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.forgotPasswordService.confirmReset(dto);
  }

  // ----------------------------------------------------------------
  // helpers
  // ----------------------------------------------------------------

  private extractMeta(request: Request): LoginMeta {
    return {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
  }
}
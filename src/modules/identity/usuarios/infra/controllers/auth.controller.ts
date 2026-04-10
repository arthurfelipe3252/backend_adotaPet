import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
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
import { LoginDto } from '@identity/usuarios/application/dto/login.dto';
import { RefreshTokenDto } from '@identity/usuarios/application/dto/refresh-token.dto';
import { AuthService } from '@identity/usuarios/application/services/auth.service';
import { LoginMeta } from '@identity/usuarios/application/types/login-meta.type';
import type { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';
import { CurrentUser } from '@identity/usuarios/infra/decorators/current-user.decorator';
import { JwtAuthGuard } from '@identity/usuarios/infra/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('users/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ----------------------------------------------------------------
  // POST /auth/login
  // ----------------------------------------------------------------
  @Post('login')
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  async logoutAll(@CurrentUser() autenticado: AuthenticatedUser): Promise<void> {
    await this.authService.logoutAll(autenticado.id);
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

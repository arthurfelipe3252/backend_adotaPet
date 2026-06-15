import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { paraSegundos } from '@shared/utils/duration.util';
import { Permission } from '@shared/domain/enums/permission.enum';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import {
  ADOTANTE_REPOSITORY,
  type AdotanteRepository,
} from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import {
  PROTETOR_ONG_REPOSITORY,
  type ProtetorOngRepository,
} from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { AuthResponseDto } from '@identity/usuarios/application/dto/auth-response.dto';
import { LoginDto } from '@identity/usuarios/application/dto/login.dto';
import { RefreshTokenDto } from '@identity/usuarios/application/dto/refresh-token.dto';
import { UsuarioResponseDto } from '@identity/usuarios/application/dto/usuario-response.dto';
import { LoginMeta } from '@identity/usuarios/application/types/login-meta.type';
import { RefreshToken } from '@identity/usuarios/domain/models/refresh-token.entity';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@identity/usuarios/domain/ports/password-hasher.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';

/**
 * Resultado da geração de um par de tokens, antes de virar AuthResponseDto.
 * Mantido como tipo interno do helper privado generateTokenPair.
 */
interface TokenPair {
  accessToken: string;
  refreshTokenPlain: string;
  refreshTokenEntity: RefreshToken;
  accessExpiresInSeconds: number;
}

/**
 * Service de autenticação do bounded context Identity.
 *
 * Responsabilidades:
 * - login:    valida credenciais e emite par de tokens
 * - refresh:  rotaciona o par de tokens (revoga antigo, emite novo) atomicamente
 * - logout:   revoga o refresh token
 *
 * Decisões importantes:
 * - Refresh token é uma string opaca (não JWT) gerada por crypto.randomBytes.
 *   Armazenamos apenas o hash SHA-256 dela no banco.
 * - SHA-256 (e não bcrypt) porque precisamos de lookup por hash, e o token
 *   já é random de alta entropia (não é uma senha fraca).
 * - Toda mensagem de erro de login/refresh é genérica ("Credenciais inválidas")
 *   pra não permitir user enumeration.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(ADOTANTE_REPOSITORY)
    private readonly adotanteRepository: AdotanteRepository,
    @Inject(PROTETOR_ONG_REPOSITORY)
    private readonly protetorOngRepository: ProtetorOngRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ==================================================================
  // login
  // ==================================================================
  async login(dto: LoginDto, meta: LoginMeta): Promise<AuthResponseDto> {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!usuario.ativo) {
      // Mesma mensagem do "não existe": evita user enumeration.
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaConfere = await this.passwordHasher.compare(
      dto.senha,
      usuario.senhaHash,
    );
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokenPair = await this.generateTokenPair(usuario, meta);
    await this.refreshTokenRepository.create(tokenPair.refreshTokenEntity);

    return this.buildAuthResponse(usuario, tokenPair);
  }

  // ==================================================================
  // refresh
  // ==================================================================
  async refresh(
    dto: RefreshTokenDto,
    meta: LoginMeta,
  ): Promise<AuthResponseDto> {
    const incomingHash = this.sha256(dto.refreshToken);
    const stored = await this.refreshTokenRepository.findByHash(incomingHash);

    if (!stored || !stored.isValid()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const usuario = await this.usuarioRepository.buscarPorId(stored.usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokenPair = await this.generateTokenPair(usuario, meta);

    // Operação atômica: revoga o antigo + insere o novo na mesma transação.
    // Se duas requests chegarem ao mesmo tempo com o mesmo refresh token,
    // só uma consegue (a outra falha com UnauthorizedException no rotate()).
    await this.refreshTokenRepository.rotate(
      stored.id!,
      tokenPair.refreshTokenEntity,
    );

    return this.buildAuthResponse(usuario, tokenPair);
  }

  // ==================================================================
  // logout
  // ==================================================================
  async logout(refreshToken: string): Promise<void> {
    const hash = this.sha256(refreshToken);
    const stored = await this.refreshTokenRepository.findByHash(hash);

    // Logout é idempotente: se o token nem existe, não faz nada.
    if (!stored || stored.id === undefined) {
      return;
    }

    await this.refreshTokenRepository.revoke(stored.id);
  }

  // ==================================================================
  // logout-all
  // ==================================================================
  async logoutAll(usuarioId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(usuarioId);
  }

  // ==================================================================
  // helpers privados
  // ==================================================================

  /**
   * Gera o hash determinístico SHA-256 de uma string. Usado pra tokens
   * que precisam ser pesquisados depois (lookup por hash).
   */
  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * Gera um novo par (access token JWT + refresh token opaco).
   * Não persiste nada — devolve a entidade RefreshToken pronta pra quem
   * chama decidir entre `create` (login) e `rotate` (refresh).
   *
   * Centralizar aqui evita duplicação de ~20 linhas idênticas entre
   * login() e refresh(), e deixa explícito que ambos os fluxos produzem
   * o mesmo tipo de credencial.
   */
  private async generateTokenPair(
    usuario: Usuario,
    meta: LoginMeta,
  ): Promise<TokenPair> {
    const accessExpiresInSeconds = paraSegundos(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '1d',
    );

    // Resolve o id de PERFIL (adotantes.id / protetores_ongs.id) e embute no JWT.
    // Os demais serviços usam esse id como identidade de dono — NÃO o usuarios.id
    // (que continua em `sub`). Sem isso, cada serviço teria que consultar o
    // user-auth pra mapear usuario→perfil.
    let adotanteId: string | undefined;
    let protetorId: string | undefined;
    if (usuario.tipoUsuario === TipoUsuario.Adotante) {
      adotanteId = (await this.adotanteRepository.buscarPorUsuarioId(usuario.id!))
        ?.id;
    } else if (
      usuario.tipoUsuario === TipoUsuario.Protetor ||
      usuario.tipoUsuario === TipoUsuario.Ong
    ) {
      protetorId = (
        await this.protetorOngRepository.buscarPorUsuarioId(usuario.id!)
      )?.id;
    }

    const accessToken = this.jwtService.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
        permissions: this.resolvePermissions(usuario.tipoUsuario),
        ...(adotanteId && { adotanteId }),
        ...(protetorId && { protetorId }),
      },
      { expiresIn: accessExpiresInSeconds },
    );

    const refreshTokenPlain = randomBytes(48).toString('base64url');
    const refreshTokenHash = this.sha256(refreshTokenPlain);

    const refreshExpiresInSeconds = paraSegundos(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    );
    const refreshExpiresAt = new Date(
      Date.now() + refreshExpiresInSeconds * 1000,
    );

    const refreshTokenEntity = RefreshToken.create({
      usuarioId: usuario.id!,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return {
      accessToken,
      refreshTokenPlain,
      refreshTokenEntity,
      accessExpiresInSeconds,
    };
  }

  /**
   * Monta o DTO de resposta a partir do usuario + tokens gerados.
   */
  private buildAuthResponse(
    usuario: Usuario,
    tokens: TokenPair,
  ): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = tokens.accessToken;
    dto.refreshToken = tokens.refreshTokenPlain;
    dto.expiresIn = tokens.accessExpiresInSeconds;
    dto.user = UsuarioResponseDto.deUsuario(usuario);
    return dto;
  }

  private resolvePermissions(tipoUsuario: TipoUsuario): Permission[] {
    const adotantePerms: Permission[] = [
      Permission.ADOTANTES_READ,
      Permission.ADOTANTES_WRITE,
      Permission.PETS_READ,
      Permission.ADOPTION_REQUESTS_READ,
      Permission.ADOPTION_REQUESTS_WRITE,
      Permission.CONVERSATIONS_READ,
      Permission.CONVERSATIONS_WRITE,
      Permission.MESSAGES_READ,
      Permission.MESSAGES_WRITE,
      Permission.QUESTIONARIO_READ,
      Permission.QUESTIONARIO_WRITE,
    ];

    const protetorPerms: Permission[] = [
      Permission.PROTETORES_READ,
      Permission.PROTETORES_WRITE,
      Permission.PETS_READ,
      Permission.PETS_WRITE,
      Permission.PETS_DELETE,
      Permission.ADOPTION_REQUESTS_READ,
      Permission.ADOPTION_REQUESTS_WRITE,
      Permission.CONVERSATIONS_READ,
      Permission.CONVERSATIONS_WRITE,
      Permission.MESSAGES_READ,
      Permission.MESSAGES_WRITE,
      Permission.REPORTS_READ,
    ];

    const map: Record<TipoUsuario, Permission[]> = {
      [TipoUsuario.Adotante]: adotantePerms,
      [TipoUsuario.Protetor]: protetorPerms,
      [TipoUsuario.Ong]: protetorPerms,
    };

    return map[tipoUsuario] ?? [];
  }
}

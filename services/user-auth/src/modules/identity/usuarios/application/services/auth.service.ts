import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { Permission } from '@shared/domain/enums/permission.enum';
import { RefreshToken } from '@identity/usuarios/domain/models/refresh-token.entity';
import type { TipoUsuario } from '@identity/usuarios/domain/models/usuario.entity';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@identity/usuarios/domain/repositories/refresh-token-repository.interface';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@identity/usuarios/domain/ports/password-hasher.interface';
import type { AuthResponseDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';

const PERMISSIONS_BY_TYPE: Record<TipoUsuario, Permission[]> = {
  adotante: [
    Permission.PETS_READ,
    Permission.ADOTANTES_READ,
    Permission.ADOTANTES_WRITE,
    Permission.ADOPTION_REQUESTS_READ,
    Permission.ADOPTION_REQUESTS_WRITE,
    Permission.CONVERSATIONS_READ,
    Permission.CONVERSATIONS_WRITE,
    Permission.MESSAGES_READ,
    Permission.MESSAGES_WRITE,
  ],
  protetor_ong: [
    Permission.PETS_READ,
    Permission.PETS_WRITE,
    Permission.PETS_DELETE,
    Permission.PROTETORES_READ,
    Permission.PROTETORES_WRITE,
    Permission.ADOPTION_REQUESTS_READ,
    Permission.ADOPTION_REQUESTS_WRITE,
    Permission.CONVERSATIONS_READ,
    Permission.CONVERSATIONS_WRITE,
    Permission.MESSAGES_READ,
    Permission.MESSAGES_WRITE,
  ],
  admin: Object.values(Permission),
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const usuario = await this.usuarioRepository.findByEmail(dto.email);
    if (!usuario || !usuario.ativo) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await this.passwordHasher.compare(dto.senha, usuario.senhaHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.issueTokens(usuario.id!, usuario.email, usuario.tipoUsuario);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const tokenHash = createHash('sha256').update(dto.refreshToken).digest('hex');
    const token = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!token || !token.isValid) throw new UnauthorizedException('Token inválido ou expirado');

    const usuario = await this.usuarioRepository.findById(token.usuarioId);
    if (!usuario || !usuario.ativo) throw new NotFoundException('Usuário não encontrado');

    token.revoke();
    await this.refreshTokenRepository.update(token);

    return this.issueTokens(usuario.id!, usuario.email, usuario.tipoUsuario);
  }

  private async issueTokens(
    usuarioId: string,
    email: string,
    tipoUsuario: TipoUsuario,
  ): Promise<AuthResponseDto> {
    const permissions = PERMISSIONS_BY_TYPE[tipoUsuario] ?? [];
    const expiresIn = 15 * 60;
    const accessToken = this.jwtService.sign(
      { sub: usuarioId, email, tipoUsuario, permissions },
      { expiresIn },
    );
    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHashNew = createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepository.create(
      RefreshToken.create({ usuarioId, tokenHash: tokenHashNew, expiresAt }),
    );
    return { accessToken, refreshToken: rawRefreshToken, expiresIn };
  }

  async logout(usuarioId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllByUsuario(usuarioId);
  }
}

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';

/**
 * Payload do JWT que assinamos no AuthService. `sub` é o id do usuário
 * (convenção do passport-jwt).
 */
interface JwtPayload {
  sub: string;
  email: string;
  tipoUsuario: TipoUsuario;
}

/**
 * Estratégia JWT do passport. Registrada como provider no UsuariosModule.
 *
 * No `validate()` carregamos o usuário do banco e checamos `ativo`.
 * Custo: 1 query por request protegido. Benefício: invalidação imediata
 * de sessões de contas desativadas (sem precisar esperar o access token expirar).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const usuario = await this.usuarioRepository.buscarPorId(payload.sub);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Token ausente ou inválido');
    }

    return {
      id: usuario.id!,
      email: usuario.email,
      tipoUsuario: usuario.tipoUsuario,
    };
  }
}

import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@identity/usuarios/infra/decorators/public.decorator';

/**
 * Guard que aciona a estratégia 'jwt' do passport (registrada em JwtStrategy).
 *
 * Registrado GLOBALMENTE como APP_GUARD no `AppModule` — todo endpoint do
 * sistema é protegido por default. Endpoints que devem responder sem auth
 * (login, cadastros, health) precisam ser marcados com o decorator
 * `@Public()`.
 *
 * Sobrescreve `handleRequest` pra lançar UnauthorizedException do NestJS,
 * garantindo que a resposta 401 siga o formato padrão do framework
 * (`{ statusCode, message, error }`) em vez do formato simplificado do
 * Passport.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<T>(err: Error | null, user: T): T {
    if (err || !user) {
      throw new UnauthorizedException('Token ausente ou inválido');
    }
    return user;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que aciona a estratégia 'jwt' do passport (registrada em JwtStrategy).
 * Aplique com @UseGuards(JwtAuthGuard) nos endpoints protegidos.
 *
 * Sobrescreve handleRequest para lançar UnauthorizedException do NestJS,
 * garantindo que a resposta 401 siga o formato padrão do framework
 * ({ statusCode, message, error }) em vez do formato simplificado do Passport.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error | null, user: T): T {
    if (err || !user) {
      throw new UnauthorizedException('Token ausente ou inválido');
    }
    return user;
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@identity/usuarios/infra/auth/types/authenticated-user.type';

/**
 * Extrai o usuário autenticado (populado pelo JwtStrategy.validate) do request.
 * Uso: `findMe(@CurrentUser() user: AuthenticatedUser)`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);

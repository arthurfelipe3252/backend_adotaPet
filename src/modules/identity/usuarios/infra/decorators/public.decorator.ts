import { SetMetadata } from '@nestjs/common';

/**
 * Marca um endpoint como público — bypassa o `JwtAuthGuard` registrado
 * globalmente no `AppModule`. Use APENAS em rotas que devem responder
 * sem autenticação: login, refresh, cadastros iniciais, health check.
 *
 * Uso:
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 *
 * O guard verifica esta metadata via `Reflector` e retorna `true` antes
 * de tentar validar o JWT.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

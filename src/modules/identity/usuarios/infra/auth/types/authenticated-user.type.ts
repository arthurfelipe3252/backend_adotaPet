import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

/**
 * Forma do objeto que vai pra `req.user` após o JwtStrategy validar a request.
 * É o que o decorator @CurrentUser() retorna nos controllers.
 *
 * Mantemos o payload mínimo (id, email, tipo) — sem expor a entidade rica
 * inteira nem dados sensíveis.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  tipoUsuario: TipoUsuario;
}

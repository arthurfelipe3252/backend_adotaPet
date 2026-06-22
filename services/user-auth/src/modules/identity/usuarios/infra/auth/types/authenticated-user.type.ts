import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

export interface AuthenticatedUser {
  id: string;
  sub: string;
  email: string;
  tipoUsuario: TipoUsuario;
  permissions: string[];
}

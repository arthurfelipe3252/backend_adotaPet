import { OmitType, PartialType } from '@nestjs/swagger';
import { CriarUsuarioDto } from '@identity/usuarios/application/dto/criar-usuario.dto';

/**
 * Body do PATCH /users/:id.
 *
 * - senha: NÃO entra aqui. Use o endpoint dedicado PATCH /users/me/password,
 *   que exige senhaAtual para confirmação.
 * - tipoUsuario: imutável após o cadastro.
 *
 * Todos os outros campos viram opcionais (PartialType).
 */
export class AtualizarUsuarioDto extends PartialType(
  OmitType(CriarUsuarioDto, ['senha', 'tipoUsuario'] as const),
) {}

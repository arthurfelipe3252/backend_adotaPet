import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AdotanteRepository } from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import type { ProtetorOngRepository } from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';

/**
 * Helpers de resolução de identidade contextual.
 *
 * O JWT carrega `usuarios.id` (e o tipo), mas tabelas operacionais como
 * `pets.protetor_id`, `adoption_requests.adopter_id`, etc. apontam para
 * `protetores_ongs.id` e `adotantes.id` — IDs DIFERENTES. Os services
 * precisam resolver esse mapeamento + aplicar a regra de autorização
 * (apenas o tipo de usuário esperado pode acessar o recurso).
 *
 * Padrão de uso (em qualquer service que precise saber o protetorId/
 * adotanteId do usuário autenticado):
 *
 *   constructor(
 *     @Inject(PROTETOR_ONG_REPOSITORY) private protetorRepo: ProtetorOngRepository,
 *   ) {}
 *
 *   async create(currentUser: AuthenticatedUser, dto: CreateXDto) {
 *     const protetorId = await resolveProtetorIdOrFail(
 *       this.protetorRepo,
 *       currentUser.id,
 *       currentUser.tipoUsuario,
 *     );
 *     // usa protetorId — NUNCA confia em campo análogo vindo do dto/body
 *   }
 */

export async function resolveProtetorIdOrFail(
  repo: ProtetorOngRepository,
  usuarioId: string,
  tipoUsuario: TipoUsuario,
): Promise<string> {
  if (tipoUsuario !== TipoUsuario.Protetor && tipoUsuario !== TipoUsuario.Ong) {
    throw new ForbiddenException(
      'Apenas usuários do tipo protetor ou ong podem acessar este recurso',
    );
  }
  const protetor = await repo.buscarPorUsuarioId(usuarioId);
  if (!protetor?.id) {
    throw new NotFoundException(
      'Perfil de protetor/ong não encontrado para o usuário autenticado',
    );
  }
  return protetor.id;
}

export async function resolveAdotanteIdOrFail(
  repo: AdotanteRepository,
  usuarioId: string,
  tipoUsuario: TipoUsuario,
): Promise<string> {
  if (tipoUsuario !== TipoUsuario.Adotante) {
    throw new ForbiddenException(
      'Apenas usuários do tipo adotante podem acessar este recurso',
    );
  }
  const adotante = await repo.buscarPorUsuarioId(usuarioId);
  if (!adotante?.id) {
    throw new NotFoundException(
      'Perfil de adotante não encontrado para o usuário autenticado',
    );
  }
  return adotante.id;
}

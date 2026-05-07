import { Module } from '@nestjs/common';
import { AdotantesModule } from '@identity/adotantes/adotantes.module';
import { EnderecosModule } from '@identity/enderecos/enderecos.module';
import { ProtetoresOngsModule } from '@identity/protetores_ongs/protetores-ongs.module';
import { UsuariosModule } from '@identity/usuarios/usuarios.module';

/**
 * Módulo agregador do bounded context Identity.
 *
 * Sub-módulos:
 * - usuarios:        entidade-mãe + auth (login, refresh, logout)
 * - enderecos:       endereço aninhado, sem controller (só repo)
 * - adotantes:       cadastro atômico de pessoa que adota (POST /users/adotantes)
 * - protetores_ongs: cadastro atômico de protetor PF / ONG PJ (POST /users/protetores-ongs)
 */
@Module({
  imports: [
    UsuariosModule,
    EnderecosModule,
    AdotantesModule,
    ProtetoresOngsModule,
  ],
  exports: [
    UsuariosModule,
    EnderecosModule,
    AdotantesModule,
    ProtetoresOngsModule,
  ],
})
export class IdentityModule {}

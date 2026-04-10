import { Module } from '@nestjs/common';
import { UsuariosModule } from '@identity/usuarios/usuarios.module';

/**
 * Módulo agregador do bounded context Identity.
 * Por enquanto contém apenas Usuarios (que internamente também trata auth).
 * Futuras entidades do contexto (adotantes, protetores_ongs, enderecos)
 * vão entrar aqui como sub-módulos siblings.
 */
@Module({
  imports: [UsuariosModule],
  exports: [UsuariosModule],
})
export class IdentityModule {}

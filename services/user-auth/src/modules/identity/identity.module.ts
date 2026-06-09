import { Module } from '@nestjs/common';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AdotantesModule } from './adotantes/adotantes.module';
import { ProtetoresOngsModule } from './protetores-ongs/protetores-ongs.module';
import { EnderecosModule } from './enderecos/enderecos.module';

@Module({
  imports: [UsuariosModule, AdotantesModule, ProtetoresOngsModule, EnderecosModule],
})
export class IdentityModule {}

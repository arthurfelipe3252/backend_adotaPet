import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { ADOTANTE_REPOSITORY } from '@identity/adotantes/domain/repositories/adotante-repository.interface';
import { AdotanteService } from '@identity/adotantes/application/services/adotante.service';
import { AdotantesController } from '@identity/adotantes/infra/controllers/adotantes.controller';
import { DrizzleAdotanteRepository } from '@identity/adotantes/infra/repositories/drizzle-adotante.repository';
import { EnderecosModule } from '@identity/enderecos/enderecos.module';
import { UsuariosModule } from '@identity/usuarios/usuarios.module';

@Module({
  imports: [SharedModule, UsuariosModule, EnderecosModule],
  controllers: [AdotantesController],
  providers: [
    AdotanteService,
    DrizzleAdotanteRepository,
    { provide: ADOTANTE_REPOSITORY, useExisting: DrizzleAdotanteRepository },
  ],
  exports: [ADOTANTE_REPOSITORY, AdotanteService],
})
export class AdotantesModule {}

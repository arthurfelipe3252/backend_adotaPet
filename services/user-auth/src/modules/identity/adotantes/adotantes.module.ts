import { Module } from '@nestjs/common';
import { AdotantesController } from './infra/controllers/adotantes.controller';
import { AdotanteService } from './application/services/adotante.service';
import { AdotanteMessagingService } from './application/services/adotante-messaging.service';
import { DrizzleAdotanteRepository } from './infra/repositories/drizzle-adotante.repository';
import { ADOTANTE_REPOSITORY } from './domain/repositories/adotante-repository.interface';
import { EnderecosModule } from '../enderecos/enderecos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [EnderecosModule, UsuariosModule],
  controllers: [AdotantesController],
  providers: [
    AdotanteService,
    AdotanteMessagingService,
    DrizzleAdotanteRepository,
    { provide: ADOTANTE_REPOSITORY, useExisting: DrizzleAdotanteRepository },
  ],
})
export class AdotantesModule {}

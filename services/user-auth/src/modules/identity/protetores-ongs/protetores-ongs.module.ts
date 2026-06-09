import { Module } from '@nestjs/common';
import { ProtetoresOngsController } from './infra/controllers/protetores-ongs.controller';
import { ProtetorOngService } from './application/services/protetor-ong.service';
import { ProtetorOngMessagingService } from './application/services/protetor-ong-messaging.service';
import { DrizzleProtetorOngRepository } from './infra/repositories/drizzle-protetor-ong.repository';
import { PROTETOR_ONG_REPOSITORY } from './domain/repositories/protetor-ong-repository.interface';
import { EnderecosModule } from '../enderecos/enderecos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [EnderecosModule, UsuariosModule],
  controllers: [ProtetoresOngsController],
  providers: [
    ProtetorOngService,
    ProtetorOngMessagingService,
    DrizzleProtetorOngRepository,
    { provide: PROTETOR_ONG_REPOSITORY, useExisting: DrizzleProtetorOngRepository },
  ],
})
export class ProtetoresOngsModule {}

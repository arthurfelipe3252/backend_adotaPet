import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { EnderecosModule } from '@identity/enderecos/enderecos.module';
import { PROTETOR_ONG_REPOSITORY } from '@identity/protetores_ongs/domain/repositories/protetor-ong-repository.interface';
import { ProtetorOngService } from '@identity/protetores_ongs/application/services/protetor-ong.service';
import { ProtetoresOngsController } from '@identity/protetores_ongs/infra/controllers/protetores-ongs.controller';
import { DrizzleProtetorOngRepository } from '@identity/protetores_ongs/infra/repositories/drizzle-protetor-ong.repository';
import { UsuariosModule } from '@identity/usuarios/usuarios.module';

@Module({
  imports: [SharedModule, UsuariosModule, EnderecosModule],
  controllers: [ProtetoresOngsController],
  providers: [
    ProtetorOngService,
    DrizzleProtetorOngRepository,
    {
      provide: PROTETOR_ONG_REPOSITORY,
      useExisting: DrizzleProtetorOngRepository,
    },
  ],
  exports: [PROTETOR_ONG_REPOSITORY, ProtetorOngService],
})
export class ProtetoresOngsModule {}

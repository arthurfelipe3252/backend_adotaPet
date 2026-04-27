import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { ENDERECO_REPOSITORY } from '@identity/enderecos/domain/repositories/endereco-repository.interface';
import { DrizzleEnderecoRepository } from '@identity/enderecos/infra/repositories/drizzle-endereco.repository';

/**
 * Sub-módulo de Endereços do bounded context Identity.
 *
 * Não tem controller próprio: endereço é sempre criado/atualizado dentro
 * da transação de cadastro do perfil que o consome (adotantes ou
 * protetores_ongs). Quando endpoints PATCH /users/me/endereco entrarem
 * em uma iteração futura, este módulo expõe o controller correspondente.
 */
@Module({
  imports: [SharedModule],
  providers: [
    DrizzleEnderecoRepository,
    { provide: ENDERECO_REPOSITORY, useExisting: DrizzleEnderecoRepository },
  ],
  exports: [ENDERECO_REPOSITORY],
})
export class EnderecosModule {}

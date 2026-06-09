import { Module } from '@nestjs/common';
import { DrizzleEnderecoRepository } from './infra/repositories/drizzle-endereco.repository';
import { ENDERECO_REPOSITORY } from './domain/repositories/endereco-repository.interface';

@Module({
  providers: [
    DrizzleEnderecoRepository,
    { provide: ENDERECO_REPOSITORY, useExisting: DrizzleEnderecoRepository },
  ],
  exports: [ENDERECO_REPOSITORY, DrizzleEnderecoRepository],
})
export class EnderecosModule {}

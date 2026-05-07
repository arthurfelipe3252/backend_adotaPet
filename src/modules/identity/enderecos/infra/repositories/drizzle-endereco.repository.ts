import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { DbExecutor } from '@shared/infra/database/types';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import { EnderecoRepository } from '@identity/enderecos/domain/repositories/endereco-repository.interface';
import {
  enderecosSchema,
  EnderecoRow,
} from '@identity/enderecos/infra/schemas/enderecos.schema';

@Injectable()
export class DrizzleEnderecoRepository implements EnderecoRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async criar(endereco: Endereco, executor?: DbExecutor): Promise<Endereco> {
    const db = executor ?? this.drizzle.db;
    const [row] = await db
      .insert(enderecosSchema)
      .values({
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
      })
      .returning();
    return Endereco.restaurar(this.paraDominio(row))!;
  }

  async buscarPorId(id: string): Promise<Endereco | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(enderecosSchema)
      .where(eq(enderecosSchema.id, id))
      .limit(1);
    return Endereco.restaurar(row ? this.paraDominio(row) : null);
  }

  async atualizar(
    endereco: Endereco,
    executor?: DbExecutor,
  ): Promise<Endereco> {
    const db = executor ?? this.drizzle.db;
    const [row] = await db
      .update(enderecosSchema)
      .set({
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        updatedAt: new Date(),
      })
      .where(eq(enderecosSchema.id, endereco.id!))
      .returning();
    return Endereco.restaurar(this.paraDominio(row))!;
  }

  async deletar(id: string, executor?: DbExecutor): Promise<void> {
    const db = executor ?? this.drizzle.db;
    await db.delete(enderecosSchema).where(eq(enderecosSchema.id, id));
  }

  private paraDominio(row: EnderecoRow) {
    return {
      id: row.id,
      logradouro: row.logradouro,
      numero: row.numero,
      complemento: row.complemento,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
      cep: row.cep,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

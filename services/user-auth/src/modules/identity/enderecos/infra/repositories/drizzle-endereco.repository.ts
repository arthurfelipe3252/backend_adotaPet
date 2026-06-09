import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Endereco } from '@identity/enderecos/domain/models/endereco.entity';
import type { EnderecoRepository } from '@identity/enderecos/domain/repositories/endereco-repository.interface';
import { enderecosSchema, type EnderecoRow } from '../database/schemas/enderecos.schema';

@Injectable()
export class DrizzleEnderecoRepository implements EnderecoRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private toEntity(row: EnderecoRow): Endereco {
    return Endereco.restore({
      id: row.id,
      cep: row.cep,
      logradouro: row.logradouro,
      numero: row.numero,
      complemento: row.complemento,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  async create(endereco: Endereco): Promise<Endereco> {
    const [row] = await this.drizzle.db.insert(enderecosSchema).values({
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento ?? null,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      createdAt: endereco.createdAt!,
      updatedAt: endereco.updatedAt!,
    }).returning();
    return this.toEntity(row);
  }

  async update(endereco: Endereco): Promise<void> {
    await this.drizzle.db.update(enderecosSchema).set({
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento ?? null,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      updatedAt: new Date(),
    }).where(eq(enderecosSchema.id, endereco.id!));
  }

  async findById(id: string): Promise<Endereco | null> {
    const rows = await this.drizzle.db.select().from(enderecosSchema)
      .where(eq(enderecosSchema.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}

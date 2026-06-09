import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { petsLocalSchema } from '../database/schemas/pets-local.schema';

export interface PetLocalData {
  externalId: string;
  nome: string;
  status: string;
  protetorId: string;
}

@Injectable()
export class DrizzlePetLocalRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async upsert(data: PetLocalData): Promise<void> {
    await this.drizzle.db
      .insert(petsLocalSchema)
      .values({
        externalId: data.externalId,
        nome: data.nome,
        status: data.status,
        protetorId: data.protetorId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: petsLocalSchema.externalId,
        set: {
          nome: data.nome,
          status: data.status,
          protetorId: data.protetorId,
          updatedAt: new Date(),
        },
      });
  }

  async deleteByExternalId(externalId: string): Promise<void> {
    await this.drizzle.db
      .delete(petsLocalSchema)
      .where(eq(petsLocalSchema.externalId, externalId));
  }
}

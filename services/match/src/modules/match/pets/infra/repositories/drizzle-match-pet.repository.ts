import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { CatalogPetPayload } from '@shared/contracts/events/catalog-events.enum';
import {
  matchPetsSchema,
  type MatchPetRow,
} from '@match/pets/infra/schemas/match-pet.schema';
import type { MatchPetRepository } from '@match/pets/domain/repositories/match-pet-repository.interface';

@Injectable()
export class DrizzleMatchPetRepository implements MatchPetRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async upsert(pet: CatalogPetPayload): Promise<void> {
    const values = {
      id: pet.id,
      protetorId: pet.protetorId,
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
      porte: pet.porte,
      sexo: pet.sexo,
      idadeMeses: pet.idadeMeses,
      castrado: pet.castrado,
      vacinado: pet.vacinado,
      temperamento: pet.temperamento,
      status: pet.status,
      fotosUrls: JSON.stringify(pet.fotosUrls ?? []),
      createdAt: new Date(pet.createdAt),
      updatedAt: new Date(pet.updatedAt),
    };

    await this.drizzle.db
      .insert(matchPetsSchema)
      .values(values)
      .onConflictDoUpdate({
        target: matchPetsSchema.id,
        set: {
          nome: values.nome,
          especie: values.especie,
          raca: values.raca,
          porte: values.porte,
          sexo: values.sexo,
          idadeMeses: values.idadeMeses,
          castrado: values.castrado,
          vacinado: values.vacinado,
          temperamento: values.temperamento,
          status: values.status,
          fotosUrls: values.fotosUrls,
          updatedAt: values.updatedAt,
        },
      });
  }

  async deleteById(id: string): Promise<void> {
    await this.drizzle.db.delete(matchPetsSchema).where(eq(matchPetsSchema.id, id));
  }

  async findAvailable(): Promise<MatchPetRow[]> {
    return this.drizzle.db
      .select()
      .from(matchPetsSchema)
      .where(eq(matchPetsSchema.status, 'disponivel'));
  }
}

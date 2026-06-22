import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { CatalogPetPayload } from '@shared/contracts/events/catalog-events.enum';
import { adoptionPetsSchema } from '@adoption/pets/infra/schemas/adoption-pet.schema';
import type { AdoptionPetRepository } from '@adoption/pets/domain/repositories/adoption-pet-repository.interface';

@Injectable()
export class DrizzleAdoptionPetRepository implements AdoptionPetRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async upsert(pet: CatalogPetPayload): Promise<void> {
    await this.drizzle.db
      .insert(adoptionPetsSchema)
      .values({
        id: pet.id,
        protetorId: pet.protetorId,
        createdAt: new Date(pet.createdAt),
        updatedAt: new Date(pet.updatedAt),
      })
      .onConflictDoUpdate({
        target: adoptionPetsSchema.id,
        set: { protetorId: pet.protetorId, updatedAt: new Date(pet.updatedAt) },
      });
  }

  async deleteById(id: string): Promise<void> {
    await this.drizzle.db
      .delete(adoptionPetsSchema)
      .where(eq(adoptionPetsSchema.id, id));
  }

  async findProtetorIdByPetId(petId: string): Promise<string | null> {
    const rows = await this.drizzle.db
      .select({ protetorId: adoptionPetsSchema.protetorId })
      .from(adoptionPetsSchema)
      .where(eq(adoptionPetsSchema.id, petId))
      .limit(1);
    return rows[0]?.protetorId ?? null;
  }
}

import { Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { UserAuthProfilePayload } from '@shared/contracts/events/user-auth-events.enum';
import { profilesSchema } from '@catalog/profiles/infra/schemas/profile.schema';
import type {
  ProfileRepository,
  ProfileView,
} from '@catalog/profiles/domain/repositories/profile-repository.interface';

@Injectable()
export class DrizzleProfileRepository implements ProfileRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async upsert(profile: UserAuthProfilePayload): Promise<void> {
    const now = new Date();
    await this.drizzle.db
      .insert(profilesSchema)
      .values({ id: profile.id, nome: profile.nome, tipo: profile.tipo, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: profilesSchema.id,
        set: { nome: profile.nome, tipo: profile.tipo, updatedAt: now },
      });
  }

  async findById(id: string): Promise<ProfileView | null> {
    const rows = await this.drizzle.db
      .select()
      .from(profilesSchema)
      .where(eq(profilesSchema.id, id))
      .limit(1);
    const r = rows[0];
    return r ? { id: r.id, nome: r.nome, tipo: r.tipo } : null;
  }

  async findByIds(ids: string[]): Promise<Map<string, ProfileView>> {
    if (ids.length === 0) return new Map();
    const rows = await this.drizzle.db
      .select()
      .from(profilesSchema)
      .where(inArray(profilesSchema.id, ids));
    return new Map(rows.map((r) => [r.id, { id: r.id, nome: r.nome, tipo: r.tipo }]));
  }
}

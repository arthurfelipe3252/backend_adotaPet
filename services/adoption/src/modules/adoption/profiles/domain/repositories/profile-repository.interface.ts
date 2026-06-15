import type { UserAuthProfilePayload } from '@shared/contracts/events/user-auth-events.enum';

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');

export interface ProfileView {
  id: string;
  nome: string;
  tipo: string;
}

export interface ProfileRepository {
  upsert(profile: UserAuthProfilePayload): Promise<void>;
  findById(id: string): Promise<ProfileView | null>;
  findByIds(ids: string[]): Promise<Map<string, ProfileView>>;
}

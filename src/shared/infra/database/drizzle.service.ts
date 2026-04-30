import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { petsSchema } from '@catalog/pets/infra/schemas/pet.schema';
import { adotantesSchema } from '@identity/adotantes/infra/schemas/adotantes.schema';
import { enderecosSchema } from '@identity/enderecos/infra/schemas/enderecos.schema';
import { protetoresOngsSchema } from '@identity/protetores_ongs/infra/schemas/protetores-ongs.schema';
import { refreshTokensSchema } from '@identity/usuarios/infra/schemas/refresh-tokens.schema';
import { usuariosSchema } from '@identity/usuarios/infra/schemas/usuarios.schema';
import { adoptionRequestsSchema } from '@adoption/adoption-requests/infra/schemas/adoption-requests.schema';

const schema = {
  pets: petsSchema,
  usuarios: usuariosSchema,
  refreshTokens: refreshTokensSchema,
  enderecos: enderecosSchema,
  adotantes: adotantesSchema,
  protetoresOngs: protetoresOngsSchema,
  adoptionRequests: adoptionRequestsSchema,
};

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly pool: Pool;
  public readonly db;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
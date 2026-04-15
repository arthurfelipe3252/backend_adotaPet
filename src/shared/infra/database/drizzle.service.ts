import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { petsSchema } from '@catalog/pets/infra/schemas/pet.schema';

const schema = {
  pets: petsSchema,
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
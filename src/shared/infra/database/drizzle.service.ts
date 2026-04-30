import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { adoptionRequestsSchema } from "@adoption/adoption-requests/infra/schemas/adoption-requests.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const schema = {
  adoptionRequestsSchema,
};

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly pool: Pool;
  public readonly db;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

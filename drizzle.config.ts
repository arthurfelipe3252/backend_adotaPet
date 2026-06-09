import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/modules/**/infra/schemas/*.ts",
  out: "./src/shared/infra/database/drizzle",
  dialect: "postgresql",
  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

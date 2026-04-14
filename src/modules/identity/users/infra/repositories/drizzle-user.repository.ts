import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { User } from "@identity/users/domain/models/user.entity";
import { type UserRepository } from "@identity/users/domain/repositories/user-repository.interface";
import { usersSchema } from "@identity/users/infra/schemas/users.schema";

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(user: User): Promise<User> {
    const [created] = await this.drizzleService.db
      .insert(usersSchema)
      .values({
        name: user.name,
        email: user.email,
        cpfcnpj: user.cpfcnpj,
      })
      .returning();

    const entity = this.toEntity(created);
    if (!entity) {
      throw new Error("falha ao criar usuario");
    }

    return entity;
  }

  async update(id: string, user: User): Promise<User | null> {
    const [updated] = await this.drizzleService.db
      .update(usersSchema)
      .set({
        name: user.name,
        email: user.email,
        cpfcnpj: user.cpfcnpj,
        updatedAt: new Date(),
      })
      .where(eq(usersSchema.id, id))
      .returning();

    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(usersSchema)
      .where(eq(usersSchema.id, id));
  }

  async findAll(): Promise<User[]> {
    const rows = await this.drizzleService.db.select().from(usersSchema);
    return rows.map((row) => this.toEntity(row)!);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.id, id));

    return this.toEntity(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.email, email));

    return this.toEntity(row);
  }

  async findByCpfcnpj(cpfcnpj: string): Promise<User | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.cpfcnpj, cpfcnpj));

    return this.toEntity(row);
  }

  private toEntity(row?: typeof usersSchema.$inferSelect): User | null {
    return User.restore(
      row
        ? {
            id: row.id,
            name: row.name,
            email: row.email,
            cpfcnpj: row.cpfcnpj,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          }
        : undefined,
    );
  }
}
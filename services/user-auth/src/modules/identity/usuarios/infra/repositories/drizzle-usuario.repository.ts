import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { PaginationParams } from '@shared/infra/hateoas';
import { Usuario, type TipoUsuario } from '@identity/usuarios/domain/models/usuario.entity';
import type { UsuarioRepository } from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import { usuariosSchema, type UsuarioRow } from '../database/schemas/usuarios.schema';

@Injectable()
export class DrizzleUsuarioRepository implements UsuarioRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private toEntity(row: UsuarioRow): Usuario {
    return Usuario.restore({
      id: row.id,
      nome: row.nome,
      email: row.email,
      senhaHash: row.senhaHash,
      telefone: row.telefone,
      tipoUsuario: row.tipoUsuario as TipoUsuario,
      ativo: row.ativo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }

  async create(usuario: Usuario): Promise<void> {
    await this.drizzle.db.insert(usuariosSchema).values({
      id: usuario.id!,
      nome: usuario.nome,
      email: usuario.email,
      senhaHash: usuario.senhaHash,
      telefone: usuario.telefone ?? null,
      tipoUsuario: usuario.tipoUsuario,
      ativo: usuario.ativo,
      createdAt: usuario.createdAt!,
      updatedAt: usuario.updatedAt!,
    });
  }

  async update(usuario: Usuario): Promise<void> {
    await this.drizzle.db.update(usuariosSchema).set({
      nome: usuario.nome,
      email: usuario.email,
      senhaHash: usuario.senhaHash,
      telefone: usuario.telefone ?? null,
      ativo: usuario.ativo,
      updatedAt: new Date(),
    }).where(eq(usuariosSchema.id, usuario.id!));
  }

  async deactivate(id: string): Promise<void> {
    await this.drizzle.db.update(usuariosSchema).set({ ativo: false, updatedAt: new Date() })
      .where(eq(usuariosSchema.id, id));
  }

  async findAll(): Promise<Usuario[]> {
    const rows = await this.drizzle.db.select().from(usuariosSchema);
    return rows.map((r) => this.toEntity(r));
  }

  async findAllPaginated(params: PaginationParams): Promise<{ rows: Usuario[]; total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const [rows, [countResult]] = await Promise.all([
      this.drizzle.db.select().from(usuariosSchema).limit(limit).offset(offset),
      this.drizzle.db.select({ count: count() }).from(usuariosSchema),
    ]);
    return { rows: rows.map((r) => this.toEntity(r)), total: countResult.count };
  }

  async findById(id: string): Promise<Usuario | null> {
    const rows = await this.drizzle.db.select().from(usuariosSchema)
      .where(eq(usuariosSchema.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const rows = await this.drizzle.db.select().from(usuariosSchema)
      .where(eq(usuariosSchema.email, email)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}

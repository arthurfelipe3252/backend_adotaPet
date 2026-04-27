import { ConflictException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import type { DbExecutor } from '@shared/infra/database/types';
import { TipoUsuario } from '@identity/usuarios/domain/enums/tipo-usuario.enum';
import { Usuario } from '@identity/usuarios/domain/models/usuario.entity';
import { UsuarioRepository } from '@identity/usuarios/domain/repositories/usuario-repository.interface';
import { usuariosSchema } from '@identity/usuarios/infra/schemas/usuarios.schema';

/**
 * Linha crua que vem do Drizzle ao consultar a tabela usuarios.
 */
type UsuarioRow = typeof usuariosSchema.$inferSelect;

/**
 * Implementação Drizzle do contrato UsuarioRepository.
 */
@Injectable()
export class DrizzleUsuarioRepository implements UsuarioRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async criar(usuario: Usuario, executor?: DbExecutor): Promise<Usuario> {
    const db = executor ?? this.drizzle.db;
    try {
      const [row] = await db
        .insert(usuariosSchema)
        .values({
          nome: usuario.nome,
          email: usuario.email,
          senhaHash: usuario.senhaHash,
          telefone: usuario.telefone,
          tipoUsuario: usuario.tipoUsuario,
          ativo: usuario.ativo,
        })
        .returning();

      return Usuario.restaurar(this.paraDominio(row))!;
    } catch (error) {
      // Defesa em profundidade contra race condition entre o check
      // buscarPorEmail e o insert. PostgreSQL code 23505 = unique_violation.
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email já cadastrado');
      }
      throw error;
    }
  }

  async atualizar(usuario: Usuario, executor?: DbExecutor): Promise<Usuario> {
    const db = executor ?? this.drizzle.db;
    try {
      const [row] = await db
        .update(usuariosSchema)
        .set({
          nome: usuario.nome,
          email: usuario.email,
          senhaHash: usuario.senhaHash,
          telefone: usuario.telefone,
          ativo: usuario.ativo,
          updatedAt: new Date(),
        })
        .where(eq(usuariosSchema.id, usuario.id!))
        .returning();
      return Usuario.restaurar(this.paraDominio(row))!;
    } catch (error) {
      // Email novo pode bater com unique de outro usuário durante PATCH.
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email já cadastrado');
      }
      throw error;
    }
  }

  async desativar(id: string): Promise<void> {
    await this.drizzle.db
      .update(usuariosSchema)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(usuariosSchema.id, id));
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(usuariosSchema)
      .where(eq(usuariosSchema.id, id))
      .limit(1);

    return Usuario.restaurar(row ? this.paraDominio(row) : null);
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    // toLowerCase defensivo: a entidade já normaliza, mas se alguém chamar
    // direto com input cru, garantimos que a query continua determinística.
    const normalizado = email.trim().toLowerCase();

    const [row] = await this.drizzle.db
      .select()
      .from(usuariosSchema)
      .where(eq(usuariosSchema.email, normalizado))
      .limit(1);

    return Usuario.restaurar(row ? this.paraDominio(row) : null);
  }

  /**
   * Converte uma linha do Drizzle para o shape esperado por Usuario.restaurar.
   */
  private paraDominio(row: UsuarioRow) {
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      senhaHash: row.senhaHash,
      telefone: row.telefone,
      tipoUsuario: row.tipoUsuario as TipoUsuario,
      ativo: row.ativo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === '23505'
    );
  }
}

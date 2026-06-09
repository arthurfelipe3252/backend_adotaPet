import { Usuario } from './usuario.entity';

describe('Usuario Entity', () => {
  describe('create', () => {
    it('deve criar um usuário com ativo=true e timestamps', () => {
      const usuario = Usuario.create({
        nome: 'João Silva',
        email: 'joao@email.com',
        senhaHash: 'hash123',
        tipoUsuario: 'adotante',
      });

      expect(usuario.nome).toBe('João Silva');
      expect(usuario.email).toBe('joao@email.com');
      expect(usuario.ativo).toBe(true);
      expect(usuario.tipoUsuario).toBe('adotante');
      expect(usuario.createdAt).toBeInstanceOf(Date);
      expect(usuario.updatedAt).toBeInstanceOf(Date);
    });

    it('deve aceitar todos os tipos de usuário', () => {
      const tipos = ['adotante', 'protetor_ong', 'admin'] as const;
      tipos.forEach((tipo) => {
        const u = Usuario.create({ nome: 'X', email: 'x@x.com', senhaHash: 'h', tipoUsuario: tipo });
        expect(u.tipoUsuario).toBe(tipo);
      });
    });
  });

  describe('restore', () => {
    it('deve restaurar um usuário existente', () => {
      const now = new Date();
      const usuario = Usuario.restore({
        id: 'uuid-1',
        nome: 'Maria',
        email: 'maria@email.com',
        senhaHash: 'hash',
        tipoUsuario: 'protetor_ong',
        ativo: false,
        createdAt: now,
        updatedAt: now,
      });

      expect(usuario).not.toBeNull();
      expect(usuario!.id).toBe('uuid-1');
      expect(usuario!.ativo).toBe(false);
    });

    it('deve retornar null para props undefined', () => {
      expect(Usuario.restore(null)).toBeNull();
      expect(Usuario.restore(undefined)).toBeNull();
    });
  });

  describe('withXxx mutators', () => {
    it('deve atualizar campos via métodos fluentes', () => {
      const usuario = Usuario.create({
        nome: 'Antigo',
        email: 'antigo@email.com',
        senhaHash: 'hash',
        tipoUsuario: 'adotante',
      });

      usuario
        .withNome('Novo Nome')
        .withEmail('novo@email.com')
        .withTelefone('11999999999')
        .withAtivo(false);

      expect(usuario.nome).toBe('Novo Nome');
      expect(usuario.email).toBe('novo@email.com');
      expect(usuario.telefone).toBe('11999999999');
      expect(usuario.ativo).toBe(false);
    });

    it('deve retornar a própria instância nos mutators (fluent)', () => {
      const usuario = Usuario.create({ nome: 'X', email: 'x@x.com', senhaHash: 'h', tipoUsuario: 'adotante' });
      expect(usuario.withNome('Y')).toBe(usuario);
    });
  });
});

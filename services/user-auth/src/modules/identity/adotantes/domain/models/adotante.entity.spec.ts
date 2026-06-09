import { Adotante } from './adotante.entity';

describe('Adotante Entity', () => {
  it('deve criar adotante com timestamps', () => {
    const adotante = Adotante.create({
      usuarioId: 'usuario-uuid',
      cpf: '123.456.789-00',
      enderecoId: 'endereco-uuid',
    });

    expect(adotante.usuarioId).toBe('usuario-uuid');
    expect(adotante.cpf).toBe('123.456.789-00');
    expect(adotante.enderecoId).toBe('endereco-uuid');
    expect(adotante.imagemBase64).toBeUndefined();
    expect(adotante.createdAt).toBeInstanceOf(Date);
  });

  it('deve restaurar adotante existente', () => {
    const now = new Date();
    const adotante = Adotante.restore({
      id: 'uuid-1',
      usuarioId: 'u-1',
      cpf: '000.000.000-00',
      enderecoId: 'e-1',
      imagemBase64: 'base64data',
      createdAt: now,
      updatedAt: now,
    });

    expect(adotante).not.toBeNull();
    expect(adotante!.id).toBe('uuid-1');
    expect(adotante!.imagemBase64).toBe('base64data');
  });

  it('deve retornar null para props nulo', () => {
    expect(Adotante.restore(null)).toBeNull();
  });
});

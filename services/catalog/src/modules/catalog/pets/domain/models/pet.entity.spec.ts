import { Pet } from './pet.entity';

describe('Pet Entity', () => {
  describe('create', () => {
    it('deve criar pet com status disponivel e timestamps', () => {
      const pet = Pet.create({
        protetorId: 'protetor-uuid',
        nome: 'Rex',
        especie: 'cao',
        porte: 'medio',
        sexo: 'macho',
        idadeMeses: 12,
        castrado: true,
        vacinado: true,
      });

      expect(pet.nome).toBe('Rex');
      expect(pet.especie).toBe('cao');
      expect(pet.status).toBe('disponivel');
      expect(pet.castrado).toBe(true);
      expect(pet.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('restore', () => {
    it('deve restaurar pet existente', () => {
      const now = new Date();
      const pet = Pet.restore({
        id: 'uuid-1',
        protetorId: 'p-1',
        nome: 'Mimi',
        especie: 'gato',
        porte: 'pequeno',
        sexo: 'femea',
        idadeMeses: 6,
        castrado: false,
        vacinado: true,
        status: 'adotado',
        createdAt: now,
        updatedAt: now,
      });

      expect(pet).not.toBeNull();
      expect(pet!.id).toBe('uuid-1');
      expect(pet!.status).toBe('adotado');
    });

    it('deve retornar null para props nulo', () => {
      expect(Pet.restore(null)).toBeNull();
    });
  });

  describe('withXxx mutators', () => {
    it('deve atualizar status via withStatus', () => {
      const pet = Pet.create({
        protetorId: 'p-1', nome: 'Rex', especie: 'cao',
        porte: 'grande', sexo: 'macho', idadeMeses: 24,
        castrado: false, vacinado: false,
      });

      pet.withStatus('em_processo');
      expect(pet.status).toBe('em_processo');
    });

    it('deve atualizar fotosUrls', () => {
      const pet = Pet.create({
        protetorId: 'p-1', nome: 'Rex', especie: 'cao',
        porte: 'grande', sexo: 'macho', idadeMeses: 24,
        castrado: false, vacinado: false,
      });

      pet.withFotosUrls(['http://img1.com', 'http://img2.com']);
      expect(pet.fotosUrls).toHaveLength(2);
    });
  });
});

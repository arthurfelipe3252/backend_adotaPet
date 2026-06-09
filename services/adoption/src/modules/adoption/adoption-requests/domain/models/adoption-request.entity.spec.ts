import { AdoptionRequest } from './adoption-request.entity';

describe('AdoptionRequest Entity', () => {
  describe('create', () => {
    it('deve criar solicitação com status received por padrão', () => {
      const request = AdoptionRequest.create({
        petId: 'pet-uuid',
        adopterId: 'adopter-uuid',
      });

      expect(request.petId).toBe('pet-uuid');
      expect(request.adopterId).toBe('adopter-uuid');
      expect(request.status).toBe('received');
      expect(request.preTriageStatus).toBe('review');
      expect(request.createdAt).toBeInstanceOf(Date);
    });

    it('deve aceitar status customizado', () => {
      const request = AdoptionRequest.create({
        petId: 'pet-uuid',
        adopterId: 'adopter-uuid',
        status: 'in_analysis',
        preTriageStatus: 'qualified',
      });

      expect(request.status).toBe('in_analysis');
      expect(request.preTriageStatus).toBe('qualified');
    });
  });

  describe('restore', () => {
    it('deve restaurar solicitação existente', () => {
      const now = new Date();
      const request = AdoptionRequest.restore({
        id: 'uuid-1',
        petId: 'pet-1',
        adopterId: 'adopter-1',
        status: 'approved',
        preTriageStatus: 'qualified',
        createdAt: now,
        updatedAt: now,
      });

      expect(request).not.toBeNull();
      expect(request!.id).toBe('uuid-1');
      expect(request!.status).toBe('approved');
    });

    it('deve retornar null para props undefined', () => {
      expect(AdoptionRequest.restore(undefined)).toBeNull();
    });
  });

  describe('withStatus', () => {
    it('deve alterar status via withStatus', () => {
      const request = AdoptionRequest.create({ petId: 'p', adopterId: 'a' });
      request.withStatus('approved');
      expect(request.status).toBe('approved');
    });
  });
});

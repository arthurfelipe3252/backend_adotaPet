import { Conversation } from './conversation.entity';

describe('Conversation Entity', () => {
  describe('create', () => {
    it('deve criar conversa com isActive=true e timestamps', () => {
      const conv = Conversation.create({
        adoptionRequestId: 'req-uuid',
        adopterId: 'adopter-uuid',
        protetorId: 'protetor-uuid',
        isActive: true,
      });

      expect(conv.adoptionRequestId).toBe('req-uuid');
      expect(conv.isActive).toBe(true);
      expect(conv.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('restore', () => {
    it('deve restaurar conversa existente', () => {
      const now = new Date();
      const conv = Conversation.restore({
        id: 'uuid-1',
        adoptionRequestId: 'req-1',
        adopterId: 'a-1',
        protetorId: 'p-1',
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });

      expect(conv).not.toBeNull();
      expect(conv!.id).toBe('uuid-1');
      expect(conv!.isActive).toBe(false);
    });

    it('deve retornar null para props nulo', () => {
      expect(Conversation.restore(null)).toBeNull();
    });
  });

  describe('withActive', () => {
    it('deve alterar isActive e retornar a instância', () => {
      const conv = Conversation.create({
        adoptionRequestId: 'r', adopterId: 'a', protetorId: 'p', isActive: true,
      });
      const result = conv.withActive(false);
      expect(result.isActive).toBe(false);
      expect(result).toBe(conv);
    });
  });
});

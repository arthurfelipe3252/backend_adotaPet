import { Message } from './message.entity';

describe('Message Entity', () => {
  describe('create', () => {
    it('deve criar mensagem com isRead=false', () => {
      const msg = Message.create({
        conversationId: 'conv-uuid',
        senderId: 'sender-uuid',
        content: 'Olá!',
        isRead: false,
      });

      expect(msg.content).toBe('Olá!');
      expect(msg.isRead).toBe(false);
      expect(msg.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('withRead', () => {
    it('deve marcar mensagem como lida', () => {
      const msg = Message.create({
        conversationId: 'c', senderId: 's', content: 'hi', isRead: false,
      });
      msg.withRead(true);
      expect(msg.isRead).toBe(true);
    });
  });

  describe('restore', () => {
    it('deve retornar null para props nulo', () => {
      expect(Message.restore(null)).toBeNull();
    });
  });
});

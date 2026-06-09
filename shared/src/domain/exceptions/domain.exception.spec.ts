import { DomainException } from './domain.exception';

describe('DomainException', () => {
  it('deve criar exceção com mensagem e nome corretos', () => {
    const error = new DomainException('Regra de negócio violada');

    expect(error.message).toBe('Regra de negócio violada');
    expect(error.name).toBe('DomainException');
    expect(error).toBeInstanceOf(Error);
  });

  it('deve ser instanceof DomainException', () => {
    const error = new DomainException('erro');
    expect(error).toBeInstanceOf(DomainException);
  });
});

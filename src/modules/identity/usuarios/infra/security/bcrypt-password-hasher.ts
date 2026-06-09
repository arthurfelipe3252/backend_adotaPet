import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '@identity/usuarios/domain/ports/password-hasher.interface';

/**
 * Implementação concreta do PasswordHasher usando bcrypt.
 * O número de salt rounds é lido do .env (BCRYPT_SALT_ROUNDS) e tem default 12.
 */
@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  constructor(config: ConfigService) {
    const fromEnv = config.get<string>('BCRYPT_SALT_ROUNDS');
    this.saltRounds = fromEnv ? Number(fromEnv) : 12;
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

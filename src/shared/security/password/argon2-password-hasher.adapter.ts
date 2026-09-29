import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { PasswordHasher } from './password-hasher.js';

@Injectable()
export class Argon2PasswordHasherAdapter implements PasswordHasher {
  hash(password: string): Promise<string> {
    // @node-rs/argon2 utiliza Argon2id por defecto.
    return hash(password, {
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 1,
      outputLen: 32,
    });
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return verify(passwordHash, password);
  }
}

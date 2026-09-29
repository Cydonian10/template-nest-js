import { Argon2PasswordHasherAdapter } from './argon2-password-hasher.adapter.js';

describe('Argon2PasswordHasherAdapter', () => {
  it('genera hashes Argon2id con sal aleatoria y verifica la contraseña', async () => {
    const adapter = new Argon2PasswordHasherAdapter();
    const first = await adapter.hash('una contraseña segura');
    const second = await adapter.hash('una contraseña segura');

    expect(first).toMatch(/^\$argon2id\$/);
    expect(first).not.toBe(second);
    await expect(adapter.verify('una contraseña segura', first)).resolves.toBe(
      true,
    );
    await expect(adapter.verify('incorrecta', first)).resolves.toBe(false);
  });
});

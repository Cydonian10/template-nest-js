import { AppDataSource } from '../dist/database/data-source.js';
import { Argon2PasswordHasherAdapter } from '../dist/shared/security/password/argon2-password-hasher.adapter.js';
import { Person } from '../dist/features/access-control/entities/person.entity.js';
import { Role } from '../dist/features/access-control/entities/roles.entity.js';
import { User } from '../dist/features/access-control/entities/user.entity.js';
import { UserRole } from '../dist/features/access-control/entities/user_roles.entity.js';
import { ROLE_CODES } from '../dist/shared/authorization/role-codes.js';

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Falta definir ${name} en el entorno.`);
  return value.trim();
}

async function main() {
  const userData = {
    email: required('SUPER_ADMIN_EMAIL'),
    nickName: required('SUPER_ADMIN_NICK_NAME'),
    password: required('SUPER_ADMIN_PASSWORD'),
    firstName: required('SUPER_ADMIN_FIRST_NAME'),
    lastName: required('SUPER_ADMIN_LAST_NAME'),
    identityDocument: required('SUPER_ADMIN_IDENTITY_DOCUMENT'),
    dateOfBirth: required('SUPER_ADMIN_DATE_OF_BIRTH'),
  };

  if (userData.password.length < 8) {
    throw new Error('SUPER_ADMIN_PASSWORD debe tener al menos 8 caracteres.');
  }

  await AppDataSource.initialize();
  try {
    await AppDataSource.transaction(async (manager) => {
      const emailNormalized = userData.email.toUpperCase();
      if (await manager.findOneBy(User, { emailNormalized })) {
        throw new Error('Ya existe un usuario con ese correo.');
      }
      const roleRepository = manager.getRepository(Role);
      const role =
        (await roleRepository.findOneBy({ code: ROLE_CODES.SUPER_ADMIN })) ??
        (await roleRepository.save(
          roleRepository.create({
            code: ROLE_CODES.SUPER_ADMIN,
            name: 'Super administrador',
            description: 'Rol de super administrador',
          }),
        ));

      const person = await manager.save(
        manager.create(Person, {
          firstName: userData.firstName,
          lastName: userData.lastName,
          identityDocument: userData.identityDocument,
          dateOfBirth: userData.dateOfBirth,
        }),
      );
      const user = await manager.save(
        manager.create(User, {
          email: userData.email,
          emailNormalized,
          nickName: userData.nickName,
          nickNameNormalized: userData.nickName.toUpperCase(),
          passwordHash: await new Argon2PasswordHasherAdapter().hash(
            userData.password,
          ),
          emailVerificationToken: null,
          persona: person,
        }),
      );

      await manager.save(
        manager.create(UserRole, {
          user,
          role,
          validFrom: new Date().toISOString().slice(0, 10),
          validUntil: null,
        }),
      );
    });

    console.log('Usuario super-admin creado.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

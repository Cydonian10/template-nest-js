# Entidades de autenticación y autorización

Este documento describe las entidades del modelo de autenticación y autorización. Los nombres de campos se presentan en `camelCase`; los tipos son conceptuales y deberán ajustarse al motor de base de datos elegido. Las reglas de normalización y unicidad indicadas deben aplicarse al guardar y actualizar los registros.

## Usuario

Representa una cuenta que puede autenticarse en el sistema.

| Campo                    | Tipo             | Descripción                                                                                                                                                           |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | UUID             | Identificador único del usuario.                                                                                                                                      |
| `email`                  | string           | Dirección de correo electrónico.                                                                                                                                      |
| `emailNormalized`        | string           | Versión canónica de `email`, convertida a mayúsculas por el sistema. Debe tener una restricción `UNIQUE` y mantenerse sincronizada al crear o actualizar el correo.   |
| `nickName`               | string           | Nombre de usuario o apodo.                                                                                                                                            |
| `nickNameNormalized`     | string           | Versión canónica de `nickName`, convertida a mayúsculas por el sistema. Debe tener una restricción `UNIQUE` y mantenerse sincronizada al crear o actualizar el apodo. |
| `passwordHash`           | string           | Hash seguro de la contraseña. La contraseña en texto plano nunca debe almacenarse ni devolverse en las respuestas.                                                    |
| `emailVerificationToken` | string, nullable | Token utilizado exclusivamente para validar la dirección de correo electrónico. No es un token de autenticación.                                                      |
| `emailVerified`          | boolean          | Indica si la dirección de correo fue validada.                                                                                                                        |
| `active`                 | boolean          | Indica si la cuenta está activa; requerido por las reglas de negocio.                                                                                                 |
| `createdAt`              | datetime         | Fecha y hora de creación del registro.                                                                                                                                |
| `updatedAt`              | datetime         | Fecha y hora de la última actualización.                                                                                                                              |
| `persona`                | relación         | Persona asociada al usuario (relación uno a uno).                                                                                                                     |

## Persona

Contiene los datos personales asociados a una cuenta de usuario.

| Campo              | Tipo     | Descripción                                                            |
| ------------------ | -------- | ---------------------------------------------------------------------- |
| `id`               | UUID     | Identificador único de la persona.                                     |
| `firstName`        | string   | Nombre de la persona.                                                  |
| `lastName`         | string   | Apellido de la persona.                                                |
| `dateOfBirth`      | date     | Fecha de nacimiento.                                                   |
| `identityDocument` | string   | Número o identificador del documento de identidad.                     |
| `active`           | boolean  | Indica si la persona está activa; requerido por las reglas de negocio. |
| `createdAt`        | datetime | Fecha y hora de creación del registro.                                 |
| `updatedAt`        | datetime | Fecha y hora de la última actualización.                               |

## Rol

Agrupa permisos y menús y puede asignarse a varios usuarios.

| Campo         | Tipo   | Descripción                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | UUID   | Identificador único del rol.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `name`        | string | Nombre del rol.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `description` | string | Descripción del rol.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `code`        | string | Código generado al crear el rol a partir de `name`: quitar espacios externos, descomponer Unicode y eliminar tildes, convertir a mayúsculas, reemplazar cada secuencia de caracteres que no sea `A-Z` o `0-9` por `_`, y quitar `_` al inicio y al final (por ejemplo, `Administrador del sistema` → `ADMINISTRADOR_DEL_SISTEMA`). Debe tener restricción `UNIQUE` entre los roles y no cambia automáticamente si cambia `name`. Si ya existe, se rechaza el alta hasta proporcionar un código único. |

## Asignación de rol a usuario (`UsuarioRol`)

Registra la asignación de un rol a un usuario y su período de vigencia.

| Campo        | Tipo           | Descripción                                                                                                   |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`         | UUID           | Identificador único de la asignación.                                                                         |
| `userId`     | UUID           | Referencia al usuario.                                                                                        |
| `roleId`     | UUID           | Referencia al rol.                                                                                            |
| `validFrom`  | date           | Fecha de inicio de la vigencia, sin componente de hora.                                                       |
| `validUntil` | date, nullable | Fecha de fin de la vigencia, sin componente de hora. Si es nula, la asignación no tiene fecha de vencimiento. |

## Permiso

Representa una acción o capacidad que puede concederse a un rol. El catálogo base se carga mediante un seed idempotente; un usuario SuperAdmin también puede crear permisos adicionales.

| Campo          | Tipo   | Descripción                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | UUID   | Identificador único del permiso.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `name`         | string | Nombre del permiso.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `resourceCode` | string | Código estable del recurso al que aplica el permiso, por ejemplo `USUARIOS`.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `actionCode`   | string | Código estable de la acción permitida, por ejemplo `LISTAR`, `CREAR` o `ELIMINAR`.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `code`         | string | Código generado automáticamente como `{resourceCode}_{actionCode}` (por ejemplo, `USUARIOS_LISTAR`). Se normalizan ambos componentes: quitar espacios externos, descomponer Unicode y eliminar tildes, convertir a mayúsculas, reemplazar cada secuencia de caracteres que no sea `A-Z` o `0-9` por `_`, y quitar `_` al inicio y al final. Debe tener restricción `UNIQUE` entre los permisos y no cambia automáticamente después de crear el permiso. Si ya existe, se rechaza el alta; no se agrega un sufijo automáticamente. |

Los seeds insertan o actualizan por `code` los permisos que administra la aplicación, sin duplicarlos ni borrar permisos creados por SuperAdmin. Crear un permiso no crea ni modifica endpoints: cada endpoint protegido debe declarar explícitamente el `code` requerido. El cambio de una ruta no cambia el código del permiso.

## Asignación de permiso a rol (`RolPermiso`)

Relaciona roles con permisos. Un rol puede tener varios permisos y un permiso puede pertenecer a varios roles.

| Campo          | Tipo    | Descripción                                        |
| -------------- | ------- | -------------------------------------------------- |
| `id`           | UUID    | Identificador único de la asignación.              |
| `roleId`       | UUID    | Referencia al rol.                                 |
| `permissionId` | UUID    | Referencia al permiso.                             |
| `active`       | boolean | Indica si el permiso está habilitado para ese rol. |

## Menú

Representa una opción de navegación disponible en un módulo.

| Campo         | Tipo    | Descripción                                    |
| ------------- | ------- | ---------------------------------------------- |
| `id`          | UUID    | Identificador único del menú.                  |
| `moduleId`    | UUID    | Referencia al módulo al que pertenece el menú. |
| `name`        | string  | Nombre del menú.                               |
| `path`        | string  | Ruta asociada al menú.                         |
| `description` | string  | Descripción del menú.                          |
| `active`      | boolean | Indica si el menú está activo.                 |

## Asignación de menú a rol (`RolMenu`)

Relaciona roles con menús. Un rol puede tener varios menús y un menú puede estar asociado a varios roles. La pareja (`roleId`, `menuId`) debe ser única para evitar asignaciones duplicadas.

| Campo    | Tipo | Descripción                           |
| -------- | ---- | ------------------------------------- |
| `id`     | UUID | Identificador único de la asignación. |
| `roleId` | UUID | Referencia al rol.                    |
| `menuId` | UUID | Referencia al menú.                   |

## Módulo

Agrupa menús y pertenece a un sistema.

| Campo         | Tipo    | Descripción                                       |
| ------------- | ------- | ------------------------------------------------- |
| `id`          | UUID    | Identificador único del módulo.                   |
| `systemId`    | UUID    | Referencia al sistema al que pertenece el módulo. |
| `name`        | string  | Nombre del módulo.                                |
| `description` | string  | Descripción del módulo.                           |
| `active`      | boolean | Indica si el módulo está activo.                  |

## Sistema

Representa un sistema que agrupa módulos.

| Campo         | Tipo    | Descripción                       |
| ------------- | ------- | --------------------------------- |
| `id`          | UUID    | Identificador único del sistema.  |
| `name`        | string  | Nombre del sistema.               |
| `path`        | string  | Ruta asociada al sistema.         |
| `description` | string  | Descripción del sistema.          |
| `active`      | boolean | Indica si el sistema está activo. |

## Relaciones

| Relación        | Cardinalidad    | Implementación o detalle                                                                       |
| --------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| Usuario–Persona | Uno a uno       | Cada usuario debe tener una persona y cada persona debe pertenecer a un único usuario.         |
| Usuario–Rol     | Muchos a muchos | Se registra mediante `UsuarioRol`, incluyendo el período de vigencia.                          |
| Rol–Permiso     | Muchos a muchos | Se registra mediante `RolPermiso`; la asignación tiene un indicador `active`.                  |
| Rol–Menú        | Muchos a muchos | Se registra mediante `RolMenu`; cada pareja (`roleId`, `menuId`) es única.                     |
| Sistema–Módulo  | Uno a muchos    | Un sistema puede tener varios módulos; cada módulo pertenece a un sistema mediante `systemId`. |
| Módulo–Menú     | Uno a muchos    | Un módulo puede tener varios menús; cada menú pertenece a un módulo mediante `moduleId`.       |

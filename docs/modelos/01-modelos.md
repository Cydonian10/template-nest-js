# Modelo de autenticación y autorización

La migración inicial crea las tablas `persons`, `users`, `systems`, `roles`, `permissions`, `user_roles` y `role_permissions`. No existen tablas de menús, módulos ni una tabla intermedia de roles y sistemas.

## Personas y usuarios

`persons` almacena nombre, apellido, fecha de nacimiento, documento, estado activo y marcas de creación/actualización. `users` almacena correo y apodo (con variantes normalizadas únicas), hash de contraseña, estado de verificación y actividad, y una referencia obligatoria y única a `persons` (`persona_id`). La contraseña nunca se devuelve en las respuestas.

## Sistemas, roles y permisos

`systems` tiene un código único, nombre, descripción, estado activo y orden. **Cada rol pertenece exactamente a un sistema** mediante `roles.system_id` obligatorio; su código es único. Un rol creado para un sistema no puede reasignarse a otro. `SUPER_ADMIN` pertenece a `ACCESS_CONTROL` pero tiene acceso global como excepción de autorización y no aparece en `GET /api/roles`.

`permissions` también tiene `system_id` obligatorio, nombre, recurso, acción y código. Son únicas las parejas `(system_id, code)` y las ternas `(system_id, resource_code, action_code)`. El catálogo administrado por la aplicación está agrupado por recurso en `src/shared/authorization/permission-definitions/access-control.ts` y se carga con `npm run migration:permissions`. Cada sistema adicional puede aportar su propio catálogo. Crear un permiso no autoriza automáticamente ninguna ruta: las rutas declaran explícitamente los códigos requeridos.

`user_roles` asigna un rol a un usuario con `valid_from` y `valid_until` opcional. `role_permissions` asigna un permiso a un rol y tiene un indicador `active`. **Solo se pueden asignar permisos del mismo sistema que el rol**, y la autorización también verifica la vigencia del rol, el permiso activo y el sistema activo. `SUPER_ADMIN` no necesita registros en `role_permissions`; el perfil indica su alcance global mediante `isSuperAdmin`.

La migración inicial no recupera datos de migraciones anteriores. Si existe una base de desarrollo con el esquema viejo, debe recrearse explícitamente antes de aplicarla.

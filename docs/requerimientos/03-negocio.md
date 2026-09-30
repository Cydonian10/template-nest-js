# Reglas de negocio

## Usuarios y personas

### RN-001

- La relación entre usuario y persona es uno a uno: cada usuario debe estar asociado a una única persona y una persona no puede estar asociada a más de un usuario.

### RN-002

- Un usuario puede tener varios roles y un rol puede estar asignado a varios usuarios.

### RN-003

- Solo un usuario activo y asociado a una persona activa puede iniciar sesión.

### RN-004

- La asignación de un rol a un usuario solo concede acceso durante su período de vigencia. Si no tiene fecha de vencimiento, se considera vigente indefinidamente. Cuando se indiquen ambas fechas, la fecha de inicio no puede ser posterior a la fecha de vencimiento.

### RN-005

- El sistema debe contar con al menos un usuario activo con el rol SuperAdmin. Este rol debe permitir el acceso a todos los menús y permisos, incluidos los que se agreguen posteriormente.

### RN-006

- No se puede desactivar al último usuario activo con el rol SuperAdmin, desactivar a su persona asociada ni quitarle dicho rol si con ello deja de existir un SuperAdmin vigente con usuario y persona activos.

## Roles

### RN-007

- Un rol puede tener varios permisos y estar asociado a varios menús. Un permiso o menú puede estar asociado a varios roles.

### RN-008

- No se puede eliminar un rol mientras esté asignado a usuarios o tenga permisos o menús asociados.

## Permisos y control de acceso

### RN-009

- Un usuario solo puede realizar una acción protegida si alguno de sus roles vigentes tiene el permiso requerido y activado. Si no cuenta con ese permiso, el acceso a la acción debe denegarse.

### RN-010

- No se puede eliminar un permiso mientras esté asociado a uno o más roles.

## Menús

### RN-011

- Un usuario puede acceder a un menú si tiene al menos un rol vigente asociado a ese menú. Los permisos del rol determinan qué acciones puede realizar dentro de los recursos correspondientes.

### RN-012

- No se puede eliminar un menú mientras esté asociado a uno o más roles o módulos.

### RN-013

- Un menú solo está disponible si está activo y su módulo y sistema asociados también están activos.

## Módulos

### RN-014

- No se puede eliminar un módulo mientras tenga menús asociados o esté asoWkciado a un sistema.

### RN-015

- Un módulo solo está disponible si tanto el módulo como su sistema asociado están activos.

## Sistemas

### RN-016

- No se puede eliminar un sistema mientras tenga módulos asociados.

### RN-017

- Al desactivar un sistema, sus módulos y menús dejan de estar disponibles. La desactivación no elimina los registros ni sus relaciones.

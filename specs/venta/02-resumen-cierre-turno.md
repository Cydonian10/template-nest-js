# SPEC 02 — Resumen y confirmación del cierre de turno

> **Estado:** Implementado
> **Dependencias:** SPEC 01 (`specs/01-cierre-turno-caja.md`)
> **Fecha:** 2026-10-31
> **Objetivo:** Exponer el desglose actualizado del turno y registrar su cierre con observación y comprobación del efectivo esperado.

## Alcance

**Incluye:**

- Consultar el resumen de un turno abierto de una caja concreta mediante `GET /api/cajas/:cajaId/turnos/:turnoId/resumen`.
- Exigir el efectivo esperado confirmado al cerrar y rechazar cambios en el total antes de registrar el cierre.
- Guardar una observación opcional de hasta 500 caracteres y devolverla en el listado de turnos y la respuesta de cierre.
- Documentar y probar el contrato, la persistencia y las operaciones concurrentes.

**Fuera de alcance:**

- Interfaz Angular, historial visual nuevo, cierre de día, denominaciones y nuevos permisos.

## Modelo de datos

- Añadir `observacionCierre: string | null` a `TurnoCaja`, con columna nullable y migración compatible con turnos existentes.
- El resumen devuelve `id`, `cajaId`, `saldoInicial`, `cobrosEfectivo`, `vueltosEfectivo`, `ingresosManuales`, `egresosManuales`, `reintegrosEfectivo` y `efectivoEsperado`, todos los importes como cadenas decimales. Componentes sin movimientos valen cero.
- El esperado es saldo inicial más cobros, menos vueltos, más ingresos, menos egresos y reintegros; utilizar los mismos filtros del cierre existente y aritmética decimal exacta.
- `POST /api/cajas/:cajaId/turnos/:turnoId/cierre` exige `efectivoContado` y `efectivoEsperadoConfirmado` como cadenas decimales, y admite `observacionCierre` opcional de hasta 500 caracteres. El importe esperado confirmado puede tener signo, pues el cálculo de operaciones podría ser negativo; el contado permanece no negativo.
- El cierre devuelve además `observacionCierre`. El listado de cajas incluye esa propiedad nullable en cada turno. No se modifica el usuario de cierre obtenido de la sesión.
- El resumen responde 404 para turno inexistente o ajeno y 409 para turno cerrado. El cierre responde 409 si el turno ya cerró o si el esperado confirmado difiere del calculado; este último error debe distinguirse mediante un código estable `EFECTIVO_ESPERADO_CAMBIO`.

## Plan de implementación

1. Añadir entidad y migración de observación nullable; ampliar lectura del listado y pruebas de turnos antiguos y cerrados.
2. Incorporar consulta, DTO y controlador del resumen; probar cada componente y su coherencia con el listado existente.
3. Ampliar validación, respuesta y comando de cierre con los campos nuevos; rechazar solicitudes antiguas sin importe confirmado.
4. Dentro de la transacción, comparar el total confirmado con el cálculo definitipo y guardar observación y cierre solo si coinciden. Coordinar los bloqueos con todas las escrituras que puedan afectar el cálculo para impedir una operación concurrente entre comprobación y cierre; probar la carrera con conexiones concurrentes.
5. Actualizar Swagger y pruebas de controlador, handler e integración; ejecutar pruebas relevantes y compilación de `api-tienda`.

## Criterios de aceptación

- [x] El resumen contiene todos los componentes reales y su total coincide con la fórmula del cierre.
- [x] El resumen identifica turnos ajenos, inexistentes y cerrados sin mostrar valores inventados.
- [x] Se rechazan importes inválidos, observaciones de más de 500 caracteres y cierres sin importe esperado confirmado.
- [x] Un total cambiado devuelve 409 con `EFECTIVO_ESPERADO_CAMBIO` y no modifica el turno.
- [x] Una operación concurrente no puede provocar que se cierre con un total distinto al confirmado.
- [x] Se admiten faltantes y sobrantes; la diferencia queda registrada con signo.
- [x] La observación persiste y aparece en la respuesta y el listado; los turnos anteriores devuelven `null`.
- [x] Pasan las pruebas relevantes y la compilación de la API.

## Decisiones tomadas y descartadas

- **Sí:** resumen específico por turno, evitando ampliar con agregados cada fila del listado.
- **Sí:** comparación obligatoria del total, aunque rompe clientes anteriores, para proteger todos los cierres.
- **Sí:** permitir cerrar con diferencias y guardar la observación opcional.
- **No:** exigir nueva confirmación si cambia el desglose pero el total permanece igual.

## Riesgos identificados

| Riesgo                                                            | Mitigación                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Escrituras concurrentes invalidan el cálculo tras la comparación. | Coordinar las transacciones de todas las operaciones que afectan el turno y comprobarlas con pruebas concurrentes. |
| Un cliente anterior deja de poder cerrar.                         | Documentar el campo obligatorio y actualizar el frontend junto con este contrato.                                  |

## Qué no incluye esta especificación

- Modal, historial visual, cierre de día y desglose por denominaciones.

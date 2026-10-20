# Estructura documental sugerida

Adapta los nombres y el nivel de detalle al proyecto. Markdown es un formato inicial fácil de mantener; usa otro formato si el usuario lo solicita. Estos archivos se crean en la ubicación del proyecto acordada con el usuario, no dentro de la carpeta del skill.

```text
requerimientos/
├── indice.md
├── contexto.md
├── transversales.md             # Solo si hay requisitos compartidos
├── decisiones-y-pendientes.md   # Solo si ya existen decisiones o preguntas abiertas
└── modulos/
    ├── autenticacion.md
    └── ventas.md
```

## Índice

Contiene el nombre del producto, objetivo en pocas líneas, estado del levantamiento, fecha de última revisión y enlaces a los demás documentos. Incluye un mapa breve de módulos y sus relaciones. No repite los requisitos completos.

## Contexto

Registra problema y resultados buscados, usuarios o actores, procesos actuales, límites del alcance, términos del negocio y fuentes consultadas. Separa lo que el usuario confirmó de hipótesis de trabajo.

## Archivo de módulo

Usa las secciones que aporten información real:

```markdown
# Autenticación

## Propósito y alcance

Qué problema resuelve este módulo y qué queda fuera por ahora.

## Actores y flujo principal

Quién interviene, qué inicia el flujo y cuál es el resultado esperado.

## Requisitos

### AUT-001 — Iniciar sesión

- Estado: confirmado | propuesto | pendiente de validar
- Necesidad: ...
- Regla o comportamiento: ...
- Criterios de aceptación:
  1. Dado ..., cuando ..., entonces ...
  2. Ante ..., el sistema ...
- Dependencias: ...
- Fuente o decisión: ...

## Casos alternos y errores

...

## Preguntas abiertas

...
```

El formato «Dado/Cuando/Entonces» es opcional; lo necesario es que la comprobación sea clara. En requisitos pequeños, combina secciones para no generar una plantilla vacía.

## Requisitos transversales

Documenta una sola vez las condiciones que afecten varios módulos y enlázalas desde ellos. Cuando corresponda, expresa una medida, contexto y método de verificación: por ejemplo, tiempo de respuesta bajo una carga acordada o nivel de permisos por rol. Evita palabras como «rápido» o «seguro» sin explicar qué significan para el proyecto.

## Decisiones y pendientes

Registra pregunta o decisión, estado, alternativas consideradas si las hubo, responsable o fuente cuando se conozca, fecha si es útil y enlaces a los requisitos afectados. Una decisión tomada debe trasladarse al requisito principal; este registro conserva el motivo y la trazabilidad.

## Criterio para dividir módulos

Propón un archivo nuevo cuando una capacidad tenga vocabulario, actores, reglas, flujos o ritmo de cambios propios, o cuando diferentes personas deban revisarla por separado. Mantén capacidades estrechamente relacionadas en el mismo archivo si dividirlas crearía navegación innecesaria. Puedes renombrar o reagrupar módulos conforme se entienda mejor el negocio, conservando enlaces e identificadores.

## Fundamento

- [ISO/IEC/IEEE 29148:2018](https://standards.ieee.org/ieee/29148/6937/) describe los atributos de buenos requisitos y un proceso iterativo de ingeniería de requisitos. Esta guía toma esos principios como orientación, sin afirmar conformidad formal con el estándar.
- [Atlassian: historias de usuario](https://www.atlassian.com/agile/project-management/user-stories) explica el valor de la perspectiva del usuario, la conversación y los criterios de aceptación.
- [GitHub Spec Kit](https://github.com/github/spec-kit) muestra un enfoque de especificaciones que evolucionan por funcionalidad. La estructura anterior es una adaptación ligera para levantamiento conversacional.

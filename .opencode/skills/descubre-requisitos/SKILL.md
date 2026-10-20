---
name: descubre-requisitos
description: Levantar, aclarar y mantener requisitos de un proyecto de software de forma incremental, con un índice y documentos separados por módulos cuando ayude a navegar el alcance. Usar al iniciar o continuar el análisis de necesidades, funcionalidades, reglas de negocio y criterios de aceptación; no para implementar código sin un levantamiento solicitado.
---

# Toma de requerimientos de software

Convierte conversaciones, notas y material existente en una especificación viva, comprensible para negocio y desarrollo. Trabaja en español salvo que el usuario prefiera otro idioma. Prioriza entender el problema y registrar decisiones; evita convertir suposiciones en requisitos confirmados.

## Al iniciar o retomar

1. Revisa si ya existen documentos de requisitos. Continúa su estructura y conserva identificadores, decisiones y redacción aprobada.
2. Identifica objetivo del producto, usuarios, procesos actuales, límites del alcance y módulos candidatos con la información disponible. Registra lo que falte como pendiente; pregunta primero por las incertidumbres que cambien el alcance o el comportamiento.
3. Crea o actualiza los archivos durante el análisis cuando el usuario haya pedido documentación. No esperes a completar todas las entrevistas. Si solo está explorando ideas, resume en la conversación y ofrece crear los archivos cuando haya contenido útil.
4. Al terminar cada avance, informa qué quedó confirmado, qué asumiste provisionalmente y cuáles son las próximas preguntas de mayor impacto.

## Conversación de descubrimiento

- Haz pocas preguntas por ronda y agrúpalas por tema. Empieza por objetivo, actores, flujo principal y resultado esperado; profundiza después en excepciones, datos, permisos, integraciones y calidad del servicio.
- Reformula cada necesidad como comportamiento observable o regla de negocio. Para flujos relevantes, captura disparador, precondiciones, pasos, alternativas, errores y resultado.
- Distingue **confirmado**, **propuesto** y **pendiente de validar**. Atribuye decisiones a la persona o fuente cuando se conozca; no inventes prioridades, cifras, políticas ni tecnología.
- Propón opciones concretas cuando haya una decisión abierta y explica su efecto. No bloquees el documento por preguntas secundarias.
- Incluye criterios de aceptación comprobables. Ejemplos o historias de usuario pueden ayudar a conversar, pero no sustituyen reglas, límites y casos de error.
- Considera requisitos transversales que cambien el diseño o la aceptación: seguridad y acceso, privacidad, rendimiento, disponibilidad, accesibilidad, auditoría, integraciones y migración de datos. Detállalos solo cuando sean relevantes; pide valores medibles cuando importen.

## Organización de archivos

Usa la estructura mínima útil descrita en [references/estructura-documental.md](references/estructura-documental.md). Como punto de partida, un archivo índice enlaza contexto, módulos y asuntos pendientes. Divide por capacidades del negocio o áreas funcionales, por ejemplo `autenticacion.md` y `ventas.md`, cuando cada una tenga reglas, actores, decisiones o evolución propias. No crees un archivo por cada requisito pequeño ni separes módulos solo por longitud. Mantén lo transversal en un lugar común y enlázalo desde los módulos afectados.

Cada requisito debe tener un identificador estable, una descripción precisa, estado de validación y forma de comprobarlo. Usa referencias cruzadas para dependencias; evita copiar el mismo requisito en varios archivos. Si una necesidad cambia, actualiza su definición principal, los enlaces y las decisiones relacionadas. No renumeres identificadores existentes solo para ordenar el documento.

## Revisión antes de entregar

- Comprueba que el índice lleva a todos los archivos y que no hay enlaces rotos ni requisitos duplicados o contradictorios.
- Separa hechos confirmados de propuestas. Señala ambigüedades, conflictos, dependencias y decisiones aún abiertas.
- Revisa que los criterios de aceptación cubran el flujo normal y los errores importantes, y que los requisitos de calidad relevantes puedan medirse o evaluarse.
- Entrega un resumen breve del alcance documentado, los cambios de esta sesión y las preguntas prioritarias. Si se solicita un documento único, compílalo a partir de los archivos modulares sin perderlos como fuente de trabajo.

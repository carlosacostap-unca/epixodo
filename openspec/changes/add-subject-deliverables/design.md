## Context

El espacio de trabajo mantiene entidades de planificación normalizadas en el cliente y las sincroniza como registros tipados en PocketBase. Los asuntos ya tienen fases, fechas clave y una relación muchos-a-muchos con tareas. Falta una entidad que represente un resultado concreto del asunto y agrupe el trabajo que lo produce.

## Goals / Non-Goals

**Goals:**

- Modelar entregables como entidades estables, editables y pertenecientes a un asunto.
- Derivar la lista y el progreso de tareas de cada entregable sin duplicar datos.
- Mantener la integridad al reasignar tareas, borrar entregables o borrar asuntos.
- Incorporar la función a la sincronización normalizada y cargar datos antiguos sin errores.
- Presentar los entregables como una sección compacta y legible del detalle del asunto.

**Non-Goals:**

- Añadir estados, fechas, archivos, responsables u orden manual a los entregables.
- Permitir que un entregable pertenezca a varios asuntos.
- Permitir que una tarea pertenezca a más de un entregable.
- Cambiar el comportamiento actual de fases, subtareas o fechas clave.

## Decisions

### Entidad propia y referencia desde la tarea

Se añadirá `SubjectDeliverable` con `id`, `subjectId`, `name`, `description`, `createdAt` y `updatedAt`. `WorkspaceData` incluirá `deliverables` y cada `Task` incluirá `deliverableId: string | null`. La lista de tareas se derivará filtrando por `deliverableId`, de modo que no existan dos fuentes de verdad. Se descartó guardar `taskIds` en el entregable porque complicaría los cambios de asignación y la sincronización.

### Una tarea solo puede vincularse a un entregable compatible

Un `deliverableId` es válido únicamente si el asunto del entregable está presente en `task.subjectIds`. Al cargar o modificar datos se limpiarán referencias incompatibles. Eliminar un entregable deja sus tareas sin entregable; eliminar un asunto elimina sus entregables y limpia esas referencias. Esto conserva las tareas y evita borrados sorpresivos.

### Persistencia normalizada

PocketBase incorporará una colección `subject_deliverables`, relacionada con `subjects`, y `tasks` incorporará una relación opcional `deliverable`. Las escrituras crearán asuntos y entregables antes de tareas; los borrados eliminarán tareas antes de entregables y entregables antes de asuntos. La serialización local tratará la ausencia del nuevo bucket o campo como listas vacías y `null`.

### Sección visual orientada al resultado

El detalle del asunto incorporará una sección “Entregables” antes de fases y fechas clave. Cada tarjeta usará un borde lateral cian como firma visual de “salida concreta”, mostrará nombre, descripción, progreso y las tareas vinculadas. La creación y edición se harán en un modal coherente con los formularios actuales. En el editor de tarea se ofrecerá un selector de entregable limitado por los asuntos elegidos.

## Risks / Trade-offs

- [Una tarea con varios asuntos puede ver varios entregables posibles] → Mostrar el asunto junto al nombre del entregable cuando haga falta y validar siempre la compatibilidad.
- [La creación del campo PocketBase puede desplegarse después del cliente] → Incluirlo en el manifiesto y en la validación de esquema; el despliegue debe aplicar el esquema antes de usar la versión nueva.
- [Eliminar un entregable puede parecer que elimina trabajo] → Conservar las tareas y comunicar en la confirmación que solo se quita la agrupación.
- [El componente principal ya es grande] → Encapsular formulario y sección en componentes locales enfocados, siguiendo el patrón existente.

## Migration Plan

1. Aplicar la colección `subject_deliverables` y el campo relacional opcional `tasks.deliverable` mediante el script idempotente de esquema.
2. Desplegar el cliente y el servidor con lectura tolerante a ausencia de entregables en datos locales antiguos.
3. Verificar creación, edición, asignación, limpieza de referencias y sincronización completa.
4. Para rollback, volver a la versión anterior del cliente; los registros nuevos permanecen aislados y las tareas conservan todos sus campos anteriores.

## Open Questions

Ninguna para el alcance actual.

## Why

Los asuntos necesitan registrar fechas clave más allá de sus fases y tareas. Incorporar hitos y vencimientos permite visualizar compromisos, entregas y eventos importantes sin convertirlos artificialmente en tareas.

## What Changes

- Cada asunto puede contener una colección de hitos y vencimientos.
- Cada elemento requiere un tipo (`hito` o `vencimiento`), una descripción y una fecha.
- Los elementos se muestran cronológicamente dentro del detalle del asunto y pueden crearse, editarse y eliminarse.
- Los espacios de trabajo existentes se normalizan con una colección vacía, sin pérdida de datos.
- Al eliminar un asunto también se eliminan sus hitos y vencimientos asociados.

## Capabilities

### New Capabilities

- `subject-milestones-deadlines`: Gestión persistente de hitos y vencimientos fechados asociados a asuntos.

### Modified Capabilities

Ninguna.

## Impact

- Modelo y helpers de dominio en `app/lib/tasks.ts`.
- Normalización, serialización y persistencia del espacio de trabajo.
- Hook de operaciones del espacio de trabajo.
- Detalle visual de asuntos y formularios interactivos.
- Pruebas de compatibilidad, validación y operaciones CRUD.

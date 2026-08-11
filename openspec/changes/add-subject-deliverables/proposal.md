## Why

Los asuntos pueden agrupar tareas y fechas, pero hoy no permiten expresar el resultado concreto que se espera producir. Los entregables añaden esa capa de planificación para reunir, dentro de cada asunto, un nombre, una descripción y las tareas necesarias para completarlo.

## What Changes

- Añadir entregables pertenecientes a un único asunto, con nombre y descripción obligatorios.
- Permitir crear, editar y eliminar entregables desde el detalle del asunto.
- Permitir asociar cada tarea a un entregable compatible con sus asuntos, o dejarla sin entregable.
- Mostrar las tareas de cada entregable y su progreso en el detalle del asunto.
- Persistir entregables y asociaciones de tareas tanto en el espacio local normalizado como en PocketBase.
- Mantener compatibles los espacios existentes, que se cargarán con una lista vacía de entregables y tareas sin asociación.

## Capabilities

### New Capabilities

- `subject-deliverables`: Gestión de entregables por asunto y agrupación de sus tareas.

### Modified Capabilities

- `normalized-pocketbase-persistence`: Persistencia normalizada de entregables y de la relación opcional entre tareas y entregables.

## Impact

- Tipos, normalización y reglas de integridad del espacio de trabajo.
- Hook de operaciones del espacio y componentes de gestión de asuntos y tareas.
- Colecciones y relaciones del esquema normalizado de PocketBase.
- Pruebas de dominio, serialización y persistencia normalizada.

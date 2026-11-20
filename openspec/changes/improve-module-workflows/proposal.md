## Why

La revisión de UX reprodujo pérdidas de cambios pendientes, ediciones con guardados inconsistentes y controles de Finanzas fuera de alcance con teclado. Los recorridos entre los módulos necesitan conservar el contexto y mostrar el siguiente paso.

## What Changes

- Recuperar los cambios pendientes tras recargar y mostrar su estado y reintento.
- Unificar la edición y el descarte de tareas, proteger el borrado y mejorar la orientación tras asignar.
- Conservar borradores de Captura y Bandeja y dar a la revisión móvil una pantalla de detalle.
- Mejorar el diálogo, la búsqueda y el acceso a movimientos de Finanzas. Ofrecer el registro explícito del egreso de un vencimiento.
- Mostrar el módulo actual y recuperar su última vista desde el selector.

## Capabilities

### New Capabilities

- `module-workflow-continuity` cubre recuperación y confirmación de acciones, y navegación entre pantallas.

### Modified Capabilities

## Impact

Abarca el almacenamiento local, la sincronización del espacio compartido y las interfaces de Captura, Bandeja, Planificación, Finanzas e Inicio.

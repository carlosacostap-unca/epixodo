## Context

«Sin asunto» reúne las tareas revisadas en Bandeja que siguen activas, sin asunto y sin tarea superior. El gestor general reúne las operaciones de tareas, sus formularios y las vistas de gestión de asuntos.

## Goals / Non-Goals

La entrega establece un módulo para trabajar con tareas. La gestión de asuntos, fases, entregables, hitos y eventos se accede desde las pantallas actuales.

## Decisions

1. Servir `/planificacion` con una interfaz de tres paneles. Usar el árbol de asuntos, las listas de tareas y el detalle con una paleta azul pizarra y selección visible. En móvil, los parámetros de la ruta identifican el panel activo y permiten volver con enlaces y con el historial.
2. Extraer las operaciones de creación, edición, estado y asignación a Planificación. Encapsular su acceso en el proveedor autenticado y conservar el sincronizador del espacio compartido. Validar los asuntos seleccionados antes de guardar y mantener las reglas actuales de fases, entregables y jerarquía.
3. Reutilizar el formulario de tareas y el selector múltiple de asuntos. El panel ofrece «Asignar asuntos» directamente. Si se guarda desde «Sin asunto», la pantalla abre la lista del primer asunto elegido. Cuando la tarea tiene varias asignaciones, sigue presente en todas.
4. Enlazar Calendario y «Gestionar asuntos» desde el módulo. Mantener la URL del asunto y el acceso a fases y entregables a través del gestor actual.

## Risks / Trade-offs

- Un asunto puede desaparecer mientras el selector está abierto. Verificar los IDs contra el estado actual y conservar la selección si se rechaza.
- Una navegación inmediata tras asignar una tarea debe mantener el guardado pendiente. Mantener el mismo proveedor entre las vistas y verificar el resultado al recargar.

## Migration Plan

Publicar las rutas, los componentes y las operaciones con las colecciones de PocketBase actuales.

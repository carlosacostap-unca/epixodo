## Purpose

Organizar las tareas de Planificación y asignarlas sin perder de vista su asunto de destino.

## ADDED Requirements

### Requirement: Planning task workspace

Planificación SHALL ofrecer un árbol jerárquico de asuntos, una lista de tareas y un panel de detalle para la tarea seleccionada. En móvil SHALL permitir abrir cada panel en orden y volver al anterior.

#### Scenario: Abrir una tarea desde el árbol

- **WHEN** la persona abre un asunto y selecciona una tarea visible
- **THEN** puede leer y editar el detalle de la tarea
- **AND THEN** en móvil puede volver a las tareas del asunto y después al árbol

#### Scenario: Consultar la jerarquía

- **WHEN** la persona abre un asunto padre
- **THEN** puede consultar las tareas asignadas directamente al padre y a sus descendientes

### Requirement: Assign reviewed tasks to subjects

Desde «Sin asunto», la persona SHALL poder asignar una tarea a uno o varios asuntos válidos. La operación SHALL conservar la identidad de la tarea y actualizar la lista de origen y las de destino.

#### Scenario: Asignar una tarea de Bandeja

- **WHEN** la persona abre una tarea revisada en «Sin asunto» y guarda sus asuntos
- **THEN** la tarea sale de «Sin asunto» y aparece en la lista del asunto elegido
- **AND THEN** la asignación se recupera al recargar después de sincronizar

#### Scenario: Conservar asignaciones múltiples

- **WHEN** la persona guarda una tarea con varios asuntos
- **THEN** la misma tarea se puede abrir desde cualquiera de ellos

### Requirement: Keep planning views reachable

Desde Planificación SHALL seguir siendo posible consultar las tareas próximas, en espera y completadas, abrir el calendario y acceder a la gestión de asuntos.

#### Scenario: Acceder a un asunto desde Calendario

- **WHEN** la persona abre desde Calendario el asunto asociado a un evento
- **THEN** se abre la lista de tareas de ese asunto en Planificación y queda disponible su gestión

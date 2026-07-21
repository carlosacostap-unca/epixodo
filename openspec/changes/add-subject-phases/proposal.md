## Why

Los asuntos necesitan una estructura temporal intermedia entre la organizacion tematica y la ejecucion diaria. Incorporar fases permite planificar y registrar el avance real de cada asunto, agrupando sus tareas sin obligar a que todas ellas pasen por una fase.

## What Changes

- Permitir que cada asunto tenga cero o mas fases ordenadas.
- Registrar en cada fase nombre, fecha de inicio planificada, fecha de inicio ejecutada, fecha de finalizacion planificada y fecha de finalizacion ejecutada.
- Permitir crear, editar, ordenar y eliminar fases desde el detalle de un asunto.
- Permitir que una tarea pertenezca opcionalmente a una fase; sin fase, la tarea permanece vinculada directamente al asunto mediante sus etiquetas actuales.
- Limitar la seleccion de fases a aquellas pertenecientes a uno de los asuntos de la tarea y mantener consistente la asignacion cuando cambien o se eliminen asuntos o fases.
- Preservar los datos existentes: los espacios de trabajo sin fases se normalizan con una coleccion vacia y las tareas existentes quedan directamente en sus asuntos.

## Capabilities

### New Capabilities
- `subject-phase-planning`: Cubre el ciclo de vida de fases de un asunto, sus cuatro fechas de planificacion/ejecucion y la asignacion opcional de tareas a fases.

### Modified Capabilities
- None.

## Impact

- Afecta los tipos de dominio de tareas y asuntos, la normalizacion y persistencia del workspace, las acciones del hook de estado y la interfaz del gestor de tareas.
- El formato persistido agrega `phases` al workspace y `phaseId` nullable a las tareas, con migracion tolerante para datos existentes.
- No requiere nuevas rutas, servicios externos ni dependencias de produccion.

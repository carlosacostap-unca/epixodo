## ADDED Requirements

### Requirement: Browse planning subjects by horizon

Asuntos SHALL abrir en Horizonte, con grupos plegables, contadores y acceso a Carpetas. La navegación SHALL conservar la selección del asunto y de la tarea al cambiar entre modos del explorador.

#### Scenario: Abrir un asunto desde Horizonte

- **WHEN** la persona entra a Asuntos y elige un asunto del explorador por horizonte
- **THEN** puede consultar sus tareas y abrir su detalle
- **AND THEN** puede volver al explorador en móvil con el grupo del asunto abierto

### Requirement: Move subjects and open the complete horizon board

El encabezado de un asunto SHALL ofrecer un selector de horizonte. El tablero completo SHALL mostrar todos los grupos y permitir mover asuntos entre ellos.

#### Scenario: Cambiar el horizonte con una tarea abierta

- **WHEN** la persona cambia el horizonte del asunto desde el selector
- **THEN** el asunto aparece en el grupo de destino y la misma tarea sigue abierta
- **AND THEN** el cambio se recupera al recargar después de sincronizar

#### Scenario: Regresar del tablero

- **WHEN** la persona abre el tablero y vuelve al explorador
- **THEN** recupera el asunto y la tarea que estaban seleccionados

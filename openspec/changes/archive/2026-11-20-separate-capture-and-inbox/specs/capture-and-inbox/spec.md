## Purpose

Registrar entradas por texto o voz y revisar su destino antes de incorporarlas a otros módulos.

## ADDED Requirements

### Requirement: Dedicated capture and review

Captura SHALL ofrecer una interfaz para texto y voz y un enlace a Bandeja. Bandeja SHALL mostrar una cola navegable y permitir leer la entrada y editar la propuesta antes de confirmar.

#### Scenario: Guardar y revisar una entrada

- **WHEN** la persona guarda una entrada desde Captura y abre Bandeja
- **THEN** puede seleccionarla, leer el texto capturado y revisar los campos de su destino

#### Scenario: Revisar una entrada sin sugerencia

- **WHEN** la persona abre una entrada disponible sin sugerencia
- **THEN** puede editar los datos para convertirla en tarea o descartar la entrada

### Requirement: Destination owns confirmation

La confirmación SHALL validar la entrada y el destino antes de actualizar el espacio. Una aceptación SHALL registrar el resultado y retirar la entrada de Bandeja en la misma actualización. Un rechazo SHALL mostrar el motivo y conservar la entrada.

#### Scenario: Registrar en Finanzas una sola vez

- **WHEN** la persona confirma dos veces una sugerencia financiera válida
- **THEN** se registra un único movimiento o vencimiento y la entrada sale de Bandeja

#### Scenario: Rechazar datos inválidos

- **WHEN** los datos editados incumplen una regla del destino
- **THEN** Bandeja conserva la entrada y permite corregir el dato indicado

#### Scenario: Mantener otros destinos de captura

- **WHEN** la persona confirma una sugerencia válida de calendario, ubicación, nutrición o espera
- **THEN** la información se registra en el destino correspondiente y la entrada sale de Bandeja

### Requirement: Reviewed task stays in planning

Al convertir una entrada en tarea, Planificación SHALL conservar la identidad de la tarea y permitir consultarla en «Sin asunto» cuando siga activa y sin asunto ni tarea padre. La confirmación SHALL sobrevivir a la sincronización y recarga.

#### Scenario: Convertir en tarea sin fecha ni asunto

- **WHEN** la persona convierte la entrada y vuelve a cargar la aplicación después de sincronizar
- **THEN** la tarea aparece en «Sin asunto» y la entrada deja de aparecer en Bandeja

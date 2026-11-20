## Purpose

Conservar los cambios y el contexto al registrar, revisar y organizar datos entre módulos.

## ADDED Requirements

### Requirement: Recover pending workspace changes

El espacio SHALL guardar cambios pendientes por cuenta y ofrecer un reintento visible. Una confirmación de sincronización SHALL depender de una escritura exitosa.

#### Scenario: Recover after a failed capture sync

- **WHEN** falla la escritura de una entrada y la persona recarga
- **THEN** la entrada sigue disponible, puede reintentar y conserva los datos existentes del servidor

### Requirement: Consistent task edits and feedback

Edición de tareas SHALL permitir guardar o cancelar los cambios juntos. El borrado SHALL requerir confirmación. Planificación móvil SHALL priorizar el detalle, y después de asignar SHALL identificar la tarea y sus asuntos en la lista de destino.

#### Scenario: Cancel a task edit

- **WHEN** la persona edita el título y las notas y cancela
- **THEN** ambos campos conservan sus valores anteriores

### Requirement: Resume module work

Captura y Bandeja SHALL conservar sus borradores durante la navegación de la sesión. Bandeja SHALL permitir abrir el detalle desde la lista en móvil y recuperar la entrada exacta al volver de otro módulo. El selector SHALL indicar el módulo actual y recuperar su última vista.

#### Scenario: Return to an in-progress review

- **WHEN** la persona cambia de entrada o abre Finanzas desde la revisión
- **THEN** puede volver a la entrada con sus campos editados

### Requirement: Find and register financial activity

Finanzas SHALL ofrecer accesos a movimientos y vencimientos, búsqueda por importe y tipo visible, y diálogos que contengan el foco y cierren con Escape. Un vencimiento registrado como pagado SHALL permitir preparar el egreso correspondiente para confirmación.

#### Scenario: Record the expense linked to a payment

- **WHEN** la persona marca pagado un vencimiento y elige registrar el egreso
- **THEN** puede revisar monto, descripción, fecha y cuenta antes de guardar un movimiento

## Purpose

Dar a Finanzas un espacio propio y permitir que los flujos de «Hoy» y Bandeja actúen sobre los mismos datos financieros.

## ADDED Requirements

### Requirement: Dedicated finance workspace

Finanzas SHALL presentar en `/finanzas` controles propios para gestionar cuentas, consultar saldos agrupados por moneda, registrar movimientos y administrar vencimientos.

#### Scenario: Abrir las finanzas existentes

- **WHEN** una persona abre Finanzas con cuentas en distintas monedas y pagos pendientes, incluidos pagos sin cuenta asignada
- **THEN** puede consultar sus movimientos, ver saldos separados por moneda y gestionar todos sus pagos pendientes

#### Scenario: Guardar finanzas con datos de otras áreas

- **WHEN** una persona registra un movimiento en un espacio que también contiene tareas y datos de Nutrición y luego completa la sincronización
- **THEN** al recargar encuentra el movimiento y conserva los registros de las demás áreas

### Requirement: Payment state across finance and daily overview

«Hoy» y Finanzas SHALL mostrar y operar sobre el mismo estado de los pagos pendientes. «Hoy» SHALL permitir marcar como pagados los vencimientos pendientes con fecha de hoy o anterior.

#### Scenario: Marcar un pago desde Hoy

- **WHEN** una persona marca como pagado un vencimiento desde «Hoy» y abre Finanzas
- **THEN** el mismo pago figura como pagado en Finanzas y deja de aparecer entre los pendientes de «Hoy»

### Requirement: Accept financial suggestions from the inbox

Bandeja SHALL permitir que la persona revise y confirme sugerencias de movimientos y de pagos. La aceptación SHALL registrar el dato con las validaciones de Finanzas y retirar la captura de Bandeja como parte de la misma actualización de la aplicación.

#### Scenario: Confirmar una sugerencia válida

- **WHEN** una persona confirma una sugerencia financiera válida
- **THEN** se crea un único registro en Finanzas y la captura sale de Bandeja

#### Scenario: Corregir una sugerencia rechazada

- **WHEN** Finanzas rechaza la sugerencia al verificar sus datos contra las cuentas y monedas actuales
- **THEN** Bandeja muestra el motivo y conserva la captura para corregirla o descartarla

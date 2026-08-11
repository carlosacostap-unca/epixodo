## Why

Los pagos pendientes hoy solo pueden registrarse si existe una cuenta financiera, aunque obligaciones como obra social, impuestos, servicios o resúmenes de tarjeta suelen conocerse antes de decidir desde dónde se pagarán. Esto impide usar Finanzas como una agenda completa de vencimientos y bloquea el alta cuando el espacio todavía no tiene cuentas.

## What Changes

- Permitir crear y editar pagos pendientes sin asociarlos a una cuenta.
- Guardar una moneda propia en cada pago pendiente para que su importe siga siendo interpretable cuando no hay cuenta.
- Mantener la cuenta como dato opcional y, cuando se elija, alinear automáticamente la moneda del pago con la moneda de esa cuenta.
- Mostrar y buscar pagos sin cuenta tanto en Finanzas como en la agenda de Hoy.
- Conservar los pagos independientes al eliminar una cuenta y mantener compatibilidad con los pagos existentes.
- Mantener los movimientos reales y los saldos sin cambios: ingresos y egresos continúan requiriendo una cuenta.

## Capabilities

### New Capabilities

- `unlinked-finance-due-payments`: Alta, edición, visualización y persistencia de obligaciones con cuenta opcional y moneda propia.

### Modified Capabilities

Ninguna. La capacidad previa de vencimientos aún vive en un cambio no archivado; esta extensión se especifica como una capacidad independiente y compatible.

## Impact

- Dominio y validación financiera en `app/lib/finance.ts`.
- Normalización local, JSON y persistencia PocketBase de pagos pendientes.
- Formularios y listados de Finanzas, agenda de Hoy y sugerencias de captura asistida.
- Pruebas del dominio financiero, codec y persistencia normalizada.
- Esquema normalizado de `finance_due_payments`, que deberá admitir cuenta vacía y almacenar moneda.

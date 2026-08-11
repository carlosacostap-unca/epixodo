## Context

Los vencimientos financieros se modelan por separado de los movimientos para no alterar saldos antes del pago, pero actualmente dependen de `FinanceAccount`: `accountId` es obligatorio, la moneda se deduce de la cuenta, la normalización descarta pagos huérfanos y la UI oculta el módulo de vencimientos cuando no hay cuentas. El cambio atraviesa el dominio, el codec, PocketBase normalizado, las sugerencias asistidas y dos superficies de UI.

## Goals / Non-Goals

**Goals:**

- Representar cualquier obligación pendiente con descripción, importe, moneda, vencimiento, categoría y estado, aun sin cuenta.
- Conservar el comportamiento actual para pagos que sí tienen cuenta.
- Migrar de forma compatible datos existentes y persistir el nuevo campo en localStorage, JSON y PocketBase.
- Hacer que el alta y la lectura sean claras en Finanzas y Hoy, incluso en un espacio sin cuentas.

**Non-Goals:**

- Crear automáticamente un egreso al marcar un pago como pagado.
- Implementar recurrencia, cuotas, recordatorios externos, débito automático o pagos parciales.
- Permitir movimientos reales sin cuenta.

## Decisions

### Cuenta anulable y moneda propia obligatoria

`FinanceDuePayment.accountId` pasa a `string | null` y el pago incorpora `currency: string`. La moneda propia evita importes ambiguos y permite que una obligación sobreviva a la ausencia o eliminación de una cuenta. Mantener una cuenta sintética “Sin cuenta” se descartó porque contaminaría saldos, resúmenes y movimientos.

Cuando se selecciona una cuenta, el formulario usa su moneda y bloquea la edición manual; cuando se elige “Sin cuenta definida”, la moneda se edita como código ISO de tres letras. Los pagos existentes reciben la moneda de su cuenta durante la normalización si el campo aún no fue persistido.

### Eliminar una cuenta conserva sus vencimientos

Eliminar una cuenta continúa eliminando sus movimientos, pero desasocia sus pagos pendientes y conserva la moneda ya almacenada. Eliminar esos pagos se descartó porque ahora son obligaciones autónomas y su pérdida sería inesperada.

### Persistencia tolerante durante la transición

El codec acepta pagos heredados con cuenta y sin `currency`, derivándola antes de validar. Acepta `accountId` nulo y rechaza referencias no nulas a cuentas inexistentes. PocketBase guarda una relación vacía y un campo de texto `currency`; el manifiesto y las pruebas de esquema describen ambos cambios.

### Una sola agenda visual

Finanzas siempre muestra la agenda de vencimientos y habilita “Pago pendiente” aunque no existan cuentas. Cada fila usa `payment.currency` para el importe y muestra el nombre de cuenta o “Sin cuenta definida”. Hoy aplica la misma regla. La firma visual ámbar existente se mantiene como señal de obligaciones, evitando introducir un subsistema visual nuevo.

### Captura asistida compatible

Las sugerencias de pago dejan de depender de que exista una cuenta compatible. Pueden aplicarse sin cuenta usando la moneda de la sugerencia; si hay cuentas compatibles, la persona puede asociar una de forma opcional.

## Risks / Trade-offs

- **[La moneda del pago puede divergir de una cuenta al editar datos antiguos]** → La UI siempre sincroniza y bloquea la moneda cuando hay cuenta, y la validación exige coincidencia.
- **[El esquema remoto puede no tener aún el nuevo campo]** → Actualizar manifiesto y script de validación junto con el código; el despliegue de esquema precede a la escritura de pagos nuevos.
- **[Desasociar pagos al borrar una cuenta cambia el comportamiento anterior]** → Informarlo en la confirmación y cubrirlo con pruebas de dominio.
- **[Marcar pagado sin cuenta no actualiza saldos]** → Mantener la explicación visible de que los vencimientos son recordatorios y los movimientos se registran por separado.

## Migration Plan

1. Actualizar el esquema normalizado para que `finance_due_payments.account` sea opcional y exista `currency`.
2. Desplegar codec y lectura remota compatibles con registros antiguos.
3. Desplegar escritura, dominio y UI con cuenta opcional.
4. Ante rollback, los clientes anteriores seguirán leyendo pagos con cuenta; los pagos sin cuenta serán ignorados por su normalizador estricto pero permanecerán almacenados.

## Open Questions

Ninguna para este alcance.

## Why

Captura y Bandeja comparten el gestor de tareas, aunque el flujo consiste en guardar una entrada y revisar su destino después. Las confirmaciones necesitan conservar la entrada cuando el destino rechaza los datos.

## What Changes

- Dar a Captura una pantalla propia para texto y voz, con acceso directo a Bandeja.
- Presentar Bandeja como una cola con el texto capturado y el formulario de destino seleccionado.
- Confirmar tareas de Planificación y sugerencias de Finanzas desde la cola. Las sugerencias de las demás áreas conservarán su destino y usarán la misma regla de aceptación.
- Incorporar «Sin asunto» en Planificación para encontrar tareas confirmadas cuya asignación sigue pendiente.

## Capabilities

### New Capabilities

- `capture-and-inbox` cubre el registro, revisión, aceptación y descarte de entradas.

### Modified Capabilities

## Impact

El cambio abarca la ruta autenticada de Captura, el estado compartido y la codificación de tareas. Usa el endpoint de captura y las colecciones actuales de PocketBase.

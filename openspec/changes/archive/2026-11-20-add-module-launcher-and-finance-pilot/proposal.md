## Why

Epixodo reúne áreas con flujos muy distintos en un mismo gestor de vistas. Una portada para elegir el área y un primer módulo con reglas y operaciones propias permitirán separar la aplicación por etapas.

## What Changes

- Abrir Inicio en `/` después de iniciar sesión. Mostrar accesos a los siete módulos y destacar «Ver mi día» con destino a `/hoy`.
- Dar a cada módulo una URL navegable y ofrecer un selector común para cambiar de módulo o volver a Inicio.
- Presentar la captura por texto o voz y la revisión en Bandeja bajo el nombre «Captura».
- Implementar Finanzas como piloto en `/finanzas`, con una interfaz centrada en saldos por moneda, movimientos y vencimientos. «Hoy» y Bandeja usarán las operaciones de Finanzas para marcar pagos y registrar sugerencias.
- Enlazar las vistas existentes de los demás módulos mediante rutas de transición.

## Capabilities

### New Capabilities

- `module-navigation` cubre la portada autenticada, el selector y las rutas de los módulos.
- `finance-module` cubre la interfaz propia de Finanzas y sus operaciones desde «Hoy» y Bandeja.

### Modified Capabilities

## Impact

La primera etapa toca las rutas y la navegación de Next.js, las vistas de Finanzas, «Hoy» y Bandeja, y el estado del espacio de trabajo. El piloto usa el contrato de sincronización y las colecciones actuales de PocketBase mediante un adaptador compartido.

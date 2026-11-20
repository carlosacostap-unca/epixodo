## 1. Inicio y navegación

- [x] 1.1 Crear el catálogo de módulos y montar el estado compartido del espacio en el layout autenticado. Verificar que una edición pendiente de guardado sobreviva al cambio de ruta.
- [x] 1.2 Implementar Inicio en `/` y el selector común. Verificar que el acceso desde la raíz lleve a Inicio y que sus tarjetas, «Ver mi día» y el selector funcionen con teclado y en pantallas móviles.
- [x] 1.3 Crear las rutas de los módulos y enlazar las vistas existentes de Captura, Planificación, Agenda personal, Esperas, Nutrición y Compañía. Verificar enlaces directos, recarga, historial, acceso con sesión cerrada y los destinos internos de los módulos agrupados.

## 2. Finanzas como módulo piloto

- [x] 2.1 Extraer un contrato tipado para las consultas y operaciones de Finanzas y conectarlo al estado autenticado. Verificar cálculos, validaciones, operaciones y pagos sin cuenta con `npm run test:finance`.
- [x] 2.2 Implementar la interfaz de `/finanzas` con saldos por moneda, movimientos y vencimientos. Verificar desde esa ruta que se pueden consultar y editar registros existentes y que los controles funcionan en escritorio y móvil.
- [x] 2.3 Conectar «Hoy» a las consultas y operaciones de Finanzas. Marcar un vencimiento desde `/hoy` y verificar que se refleja en `/finanzas` y desaparece de los pendientes del día.
- [x] 2.4 Conectar las sugerencias financieras de Bandeja al contrato del módulo. Verificar que una aceptación crea un único registro incluso si se repite la confirmación y que un borrador rechazado muestra el motivo y conserva la captura.

## 3. Verificar el piloto

- [x] 3.1 Ejecutar `npm run test:finance`, `npm run test:normalized-persistence`, `npm run lint` y `npm run build`. Verificar que al guardar desde Finanzas y recargar se conservan el cambio financiero y los registros de otras áreas.

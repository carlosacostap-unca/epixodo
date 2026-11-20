## Context

`app/page.tsx` muestra el formulario de acceso o monta `TaskManager`, que selecciona las vistas con estado local. `useTaskWorkspace` carga, edita y sincroniza el `WorkspaceData` completo. Finanzas ya tiene reglas en `app/lib/finance.ts`, una vista propia y dos integraciones que pasan por el hook, los pagos de «Hoy» y las sugerencias de Bandeja.

## Goals / Non-Goals

El piloto establece límites entre navegación, presentación y operaciones de Finanzas. Las áreas existentes se incorporan por etapas. El alcance de persistencia es el contrato de sincronización actual y sus colecciones por usuario.

## Decisions

1. **Usar las rutas como fuente de la navegación.** Agrupar las páginas autenticadas bajo un layout compartido con un catálogo de destinos para Inicio y el selector. Usar enlaces reales para permitir recargar, compartir rutas y navegar con el historial. Mantener «Hoy» en `/hoy`, con su composición de datos del día. Usar rutas delgadas para enlazar las vistas de transición y conservar sus destinos secundarios, incluida Bandeja dentro de Captura. Resolver el acceso con la autenticación existente en los puntos que sirven contenido o datos al usuario.
2. **Mantener una instancia de sincronización en el área autenticada.** Alojar el estado que edita `WorkspaceData` en un proveedor compartido, de modo que cambiar de ruta conserve los cambios pendientes y la programación del guardado. `GET` y `PUT /api/workspace` siguen operando con documentos completos. Las páginas y componentes pueden recibir selecciones más pequeñas del mismo estado.
3. **Dar a Finanzas una interfaz y un contrato propios.** Componer en `/finanzas` una cabecera de saldos por moneda, un registro de movimientos y una vista de pagos. Reutilizar los formularios y las reglas actuales. Definir un contrato tipado de consultas y operaciones sobre cuentas, movimientos y pagos. Finanzas, «Hoy» y Bandeja consumen ese contrato, con un adaptador que traduce las operaciones al estado compartido. La UI de Finanzas recibe ese contrato a través de sus propiedades o de un contexto específico.
4. **Confirmar sugerencias con una actualización conjunta del espacio.** Validar la captura y el borrador contra el estado actual. Ante una aceptación, registrar el dato financiero y retirar la captura en la misma actualización del estado de la aplicación. Ante un rechazo, devolver un resultado que la Bandeja pueda mostrar y conservar la captura. La comprobación de que sigue disponible protege contra confirmaciones repetidas en la misma sesión.

## Risks / Trade-offs

- Dos instancias del hook durante la transición podrían sincronizar copias diferentes. Verificar que la navegación entre Inicio, «Hoy», Captura y Finanzas use una única instancia del estado autenticado.
- El sincronizador normalizado interpreta el contenido enviado como la fotografía completa del espacio. Un guardado desde Finanzas debe preservar los registros de las demás áreas en esa fotografía. Verificarlo con datos de más de un módulo.
- El límite del módulo y la interfaz se pueden verificar antes de separar la persistencia. La sincronización y su señal de error continúan siendo compartidas durante el piloto.

## Migration Plan

Introducir la portada, el selector y las rutas de transición. A continuación, conectar Finanzas, «Hoy» y Bandeja al contrato de Finanzas y verificar los flujos contra el contrato de persistencia existente. El despliegue y la reversión del piloto se hacen con versiones de la aplicación compatibles con el mismo esquema de PocketBase.

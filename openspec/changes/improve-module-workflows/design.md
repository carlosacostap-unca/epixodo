## Context

El navegador sincroniza un documento completo con PocketBase. Los formularios y el selector de módulos usan estado local de distintas pantallas.

## Goals / Non-Goals

Conservar los cambios confirmados y el contexto durante la navegación, usando las colecciones y el contrato de espacio actuales.

## Decisions

1. Guardar por cuenta el último estado confirmado y la versión pendiente. Al reintentar, aplicar los cambios locales sobre el estado más reciente del servidor y serializar los envíos del navegador.
2. Mantener un borrador de edición en Planificación. Guardar juntos los campos cambiados y mantener la operación directa de asignación en lectura. Confirmar el borrado.
3. Mantener borradores de Captura y su cola en el proveedor autenticado. Identificar cada revisión por URL y reaprovechar el recorrido lista a detalle en móvil.
4. Reutilizar el diálogo nativo para Finanzas y ofrecer accesos a secciones. La acción de egreso prepara un formulario con los datos del pago y espera confirmación explícita.
5. Recordar la última URL de cada módulo dentro de la sesión. Usar cabeceras móviles compactas y mantener la paleta de cada módulo. El indicador de estado y los enlaces de vuelta siguen el mismo patrón entre módulos.

## Risks / Trade-offs

- Una copia local global de una versión anterior carece de identidad de cuenta. Usar datos del servidor y almacenamiento identificado por cuenta para la recuperación.
- El endpoint acepta instantáneas, con posibles conflictos si dos dispositivos escriben simultáneamente. La recuperación combina cambios por identidad antes del envío y conserva una cola dentro de la sesión.

## Migration Plan

Publicar el nuevo almacenamiento local y las vistas con las colecciones actuales. Verificar con fallos simulados y tareas ya existentes.

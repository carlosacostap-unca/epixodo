## Context

La aplicación identifica como entradas de Bandeja las tareas activas sin fechas, asunto ni padre. Finanzas ya valida y confirma sugerencias con una actualización única del estado compartido. El gestor general concentra el resto de la distribución.

## Goals / Non-Goals

El módulo se encarga de registrar y revisar entradas. Los destinos conservan sus reglas y el estado compartido sigue sincronizando el espacio completo.

## Decisions

1. Servir Captura con una página propia bajo el layout autenticado. La URL `/captura?vista=bandeja` accede a una cola con lista y panel de revisión. Reutilizar la grabación y los formularios, con una paleta de tinta y ámbar, una línea de margen en el editor y el destino visible junto al texto original.
2. Aplicar cada confirmación contra el estado más reciente. Captura invoca las funciones de validación y creación de los destinos. El resultado de error conserva la entrada, y una confirmación repetida sobre una entrada resuelta no vuelve a registrar datos.
3. Convertir una captura en tarea conservando su identidad y marcándola como revisada. Usar metadatos en las notas persistidas, como ya hace el adaptador con la sugerencia de IA. El codec separa las notas visibles de la marca. «Sin asunto» muestra las tareas revisadas que aún necesitan una asignación.

## Risks / Trade-offs

- La forma anterior de identificar entradas también incluye tareas históricas. Las tareas sin la marca siguen disponibles para revisión y la cola ofrece convertir en tarea incluso si la IA no propuso un destino.
- La confirmación actualiza el espacio local y la sincronización existente registra los cambios en PocketBase. El mensaje de sincronización sigue informando los fallos del guardado remoto.

## Migration Plan

Leer las entradas existentes con el codec compatible y escribir la marca al confirmar nuevas conversiones. Verificar la recarga con el esquema actual de PocketBase.

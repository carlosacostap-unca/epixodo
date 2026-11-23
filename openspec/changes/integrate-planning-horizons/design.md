## Context

Planificación reúne el explorador, la lista de tareas y el detalle. La maqueta aprobada incorpora los grupos de Horizonte al explorador y ofrece el tablero a ancho completo.

## Goals

- Acceder a Horizonte al entrar en Asuntos y alternar con Carpetas conservando la selección.
- Mover un asunto desde su lista de tareas y conservar el detalle abierto.

## Decisions

- La URL conserva el modo del explorador y la selección. La URL existente de Asuntos abre Horizonte.
- El explorador muestra los grupos plegables. El tablero ocupa el área de trabajo y permite arrastrar asuntos. El selector nativo en el encabezado del asunto ofrece el mismo cambio con teclado o pantalla táctil.
- Ambos modos de Horizonte usan los grupos existentes y muestran la ruta de la carpeta padre para identificar los asuntos.
- Los cambios de horizonte usan la operación de persistencia existente del espacio de trabajo.
- La interfaz usa las superficies azul oscuro, los bordes discretos y la selección celeste de la maqueta. En pantallas estrechas, se abre un panel a la vez.

## Risks / Trade-offs

Ocho grupos pueden ocupar varias filas en móvil. El explorador permite plegar cada grupo y revela el grupo del asunto seleccionado al abrirlo.

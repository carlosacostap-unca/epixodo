## Context

El espacio de trabajo ya persiste asuntos jerárquicos, tareas y fases mediante un único documento serializable. El detalle del asunto es el lugar natural para añadir referencias fechadas, y el códec existente debe seguir aceptando documentos creados antes de esta capacidad.

## Goals / Non-Goals

**Goals:**

- Representar hitos y vencimientos con una estructura común y un discriminador de tipo.
- Proveer operaciones completas de creación, edición y eliminación.
- Mostrar las fechas clave ordenadas cronológicamente en el detalle del asunto.
- Mantener la normalización y persistencia retrocompatibles.

**Non-Goals:**

- Notificaciones, recordatorios o recurrencia.
- Vincular hitos o vencimientos con tareas.
- Estados de completitud, adjuntos o responsables.

## Decisions

### Usar una colección unificada de eventos de asunto

El espacio de trabajo incorporará `subjectEvents`, cuyos elementos contienen `id`, `subjectId`, `phaseId`, `kind`, `description`, `date` y `createdAt`. `kind` será una unión cerrada entre `milestone` y `deadline`; `phaseId` será opcional y solo podrá apuntar a una fase del mismo asunto.

Una colección unificada evita duplicar normalización, operaciones CRUD y componentes. Se descartaron dos colecciones separadas porque ambas entidades comparten exactamente el mismo ciclo de vida y atributos solicitados.

### Exigir descripción y fecha válidas

La creación y edición recortarán la descripción y exigirán una fecha ISO local `YYYY-MM-DD`. El formulario utilizará controles nativos `textarea` y `input type="date"`, mientras que el dominio y el códec volverán a validar los datos para no depender exclusivamente de la interfaz.

### Orden cronológico estable

Los elementos se ordenarán por fecha ascendente y, cuando coincidan, por fecha de creación e identificador. El orden se derivará al renderizar y no se persistirá, evitando mantener un campo de posición redundante.

### Integración en el detalle del asunto

Una nueva sección convivirá con las fases y las tareas. Ofrecerá filtros visuales por tipo, una línea temporal compacta y un modal reutilizable para crear o editar elementos.

La fase se elegirá entre las fases del asunto activo. Si una fase se elimina, el evento se conservará y su asociación volverá a `null`; durante la normalización también se limpiarán referencias inexistentes o pertenecientes a otro asunto.

### Eliminación en cascada y migración tolerante

Al eliminar un asunto se eliminarán los eventos vinculados. Los espacios antiguos sin `subjectEvents` se cargarán con una colección vacía; los registros inválidos o asociados a asuntos inexistentes se descartarán durante la normalización.

## Risks / Trade-offs

- [Una fecha sin hora no expresa zona horaria] → Se persistirá como `YYYY-MM-DD` y se formateará como fecha local, evitando conversiones UTC.
- [Una colección grande puede alargar el detalle] → La sección tendrá altura y densidad controladas, además de filtros por tipo.
- [Datos remotos malformados] → El códec filtrará tipos, fechas, descripciones y referencias inválidas antes de exponer el espacio de trabajo.

## Migration Plan

1. Añadir `subjectEvents` al modelo y al espacio vacío.
2. Normalizar documentos antiguos a una colección vacía.
3. Desplegar las operaciones y la interfaz en el mismo cambio.
4. El rollback puede ignorar el campo adicional porque los lectores anteriores ya toleran propiedades desconocidas.

## Open Questions

Ninguna para el alcance solicitado.

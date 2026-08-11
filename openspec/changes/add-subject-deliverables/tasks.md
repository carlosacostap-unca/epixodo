## 1. Modelo de dominio

- [x] 1.1 Añadir tipos, creación, edición, validación, orden y eliminación segura de entregables
- [x] 1.2 Incorporar `deliverables` y `deliverableId` a la normalización compatible del espacio de trabajo
- [x] 1.3 Exponer operaciones de entregables y reglas de asignación desde el hook del espacio

## 2. Persistencia normalizada

- [x] 2.1 Añadir `subject_deliverables` y la relación opcional de tareas al manifiesto de PocketBase
- [x] 2.2 Leer, escribir, verificar y eliminar entregables en orden seguro en la persistencia normalizada

## 3. Interfaz

- [x] 3.1 Crear formulario accesible para añadir y editar entregables
- [x] 3.2 Mostrar entregables, progreso y tareas en el detalle del asunto
- [x] 3.3 Permitir asignar y quitar el entregable desde la edición de una tarea

## 4. Verificación

- [x] 4.1 Añadir pruebas de dominio, compatibilidad y limpieza de referencias
- [x] 4.2 Añadir pruebas de ida y vuelta para la persistencia normalizada
- [x] 4.3 Ejecutar pruebas, lint, build y validación OpenSpec
- [x] 4.4 Revisar visualmente el flujo de entregables en escritorio y móvil

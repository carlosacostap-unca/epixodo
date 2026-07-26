## 1. Preparación y contratos de dominio

- [x] 1.1 Leer las guías locales de Next.js 16 relevantes en `node_modules/next/dist/docs/` antes de modificar componentes, estado cliente o rutas.
- [x] 1.2 Crear `app/lib/nutrition.ts` con tipos para perfil, alimentos, preparaciones, plan, consumo, hidratación y listas de compras.
- [x] 1.3 Implementar conversiones validadas entre valores decimales de UI y enteros en milésimas, además de formateadores nutricionales.
- [x] 1.4 Implementar constructores y validadores de borradores para todas las entidades nutricionales.
- [x] 1.5 Implementar cálculo de nutrientes para cantidades de alimentos, preparaciones y elementos planificados.
- [x] 1.6 Implementar cálculo de totales diarios planificados, consumidos, hidratación y progreso frente a objetivos opcionales.
- [x] 1.7 Implementar selectores semanales y detección de referencias activas que bloquean la eliminación de alimentos o preparaciones.

## 2. Generación de compras e historial

- [x] 2.1 Implementar la creación de instantáneas de consumo desde alimentos, preparaciones y elementos planificados.
- [x] 2.2 Implementar la expansión de preparaciones y consolidación por alimento y unidad para un intervalo planificado.
- [x] 2.3 Implementar constructores y operaciones puras para listas de compras editables, artículos manuales y marcas de compra.
- [x] 2.4 Añadir pruebas unitarias de cálculos, redondeo, instantáneas históricas, consolidación de compras y referencias bloqueantes.

## 3. Workspace, normalización y sincronización

- [x] 3.1 Extender `WorkspaceData` y `emptyWorkspace` con el perfil y las colecciones nutricionales.
- [x] 3.2 Extender `normalizeWorkspaceData` para validar y reparar datos nutricionales en orden de dependencia, conservando instantáneas históricas válidas.
- [x] 3.3 Extender serialización local, solicitudes remotas, hidratación y detección de contenido con todos los campos nutricionales.
- [x] 3.4 Añadir pruebas de workspaces anteriores, entidades malformadas, referencias huérfanas y round-trip de datos nutricionales válidos.
- [x] 3.5 Verificar que el documento nutricional se sincroniza mediante `/api/workspace` sin cambios en el esquema de PocketBase.

## 4. Operaciones del estado de aplicación

- [x] 4.1 Añadir al hook operaciones para crear y actualizar el perfil nutricional.
- [x] 4.2 Añadir operaciones CRUD de alimentos con validación de referencias antes de eliminar.
- [x] 4.3 Añadir operaciones CRUD de preparaciones con validación de ingredientes y referencias antes de eliminar.
- [x] 4.4 Añadir operaciones para crear, editar, copiar y eliminar elementos del plan semanal.
- [x] 4.5 Añadir operaciones para registrar consumos desde el plan o de forma independiente, editar sus datos permitidos y eliminarlos.
- [x] 4.6 Añadir operaciones CRUD para hidratación diaria.
- [x] 4.7 Añadir operaciones para generar, reemplazar, editar y eliminar listas y artículos de compras.
- [x] 4.8 Exponer selectores memoizados de resumen diario y plan semanal evitando persistir valores derivados.

## 5. Shell y panel diario

- [x] 5.1 Añadir la vista principal `nutrition`, su etiqueta, icono, descripción, navegación y búsqueda contextual al shell autenticado.
- [x] 5.2 Crear un componente `NutritionView` aislado con navegación interna para Hoy, Plan semanal, Biblioteca y Compras.
- [x] 5.3 Crear el formulario de perfil y objetivos con validación, restricciones textuales y aclaración de alcance no médico.
- [x] 5.4 Implementar el panel Hoy con selector de fecha, comidas planificadas, consumo real, hidratación y estados vacíos.
- [x] 5.5 Implementar indicadores de energía, macronutrientes, fibra y agua únicamente para objetivos configurados, incluyendo excesos sin truncarlos.
- [x] 5.6 Implementar las acciones rápidas para copiar una comida planificada al consumo y registrar agua o consumos no planificados.

## 6. Plan, biblioteca y compras

- [x] 6.1 Implementar el planificador semanal agrupado por fecha y tipo de comida, con navegación entre semanas.
- [x] 6.2 Implementar formularios para crear, editar, copiar y eliminar elementos planificados de alimentos o preparaciones.
- [x] 6.3 Implementar la biblioteca de alimentos con búsqueda, formulario validado, edición y mensajes de eliminación bloqueada.
- [x] 6.4 Implementar la biblioteca de preparaciones con editor de ingredientes, porciones y vista de nutrientes totales y por porción.
- [x] 6.5 Implementar la selección de intervalo y previsualización para generar una lista de compras desde el plan.
- [x] 6.6 Implementar la vista de listas de compras con edición de cantidades, marcas, eliminación y artículos manuales.
- [x] 6.7 Solicitar confirmación antes de regenerar una lista existente o ejecutar eliminaciones destructivas permitidas.
- [x] 6.8 Verificar accesibilidad por teclado, etiquetas, foco de modales y comportamiento responsive de todas las superficies nutricionales.

## 7. Verificación integral

- [x] 7.1 Añadir pruebas de operaciones del hook para CRUD, copia de plan a consumo, hidratación y regeneración de compras.
- [x] 7.2 Añadir pruebas de UI para el flujo perfil → alimento → preparación → plan → consumo → compras.
- [x] 7.3 Ejecutar lint, pruebas nutricionales, pruebas existentes y build de producción; corregir todas las regresiones.
- [x] 7.4 Verificar manualmente carga, edición, recarga y sincronización de un workspace anterior y uno con datos nutricionales.

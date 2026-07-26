## Context

Epixodo es un workspace personal local-first construido con Next.js 16. La página autenticada renderiza un único shell cliente; `useTaskWorkspace` mantiene el estado completo, lo guarda en `localStorage` y sincroniza el mismo documento JSON mediante `/api/workspace` con PocketBase. `normalizeWorkspaceData` es la frontera de compatibilidad para workspaces antiguos o datos malformados. El módulo de Finanzas ya estableció el patrón de añadir un dominio independiente, colecciones al workspace, operaciones en el hook y una vista principal sin crear nuevas colecciones remotas.

El módulo nutricional cruza modelo, normalización, persistencia, cálculos derivados y UI. Además debe evitar dos errores de producto: presentar objetivos como consejo médico y modificar silenciosamente el historial cuando cambia un alimento de la biblioteca.

## Goals / Non-Goals

**Goals:**

- Convertir objetivos nutricionales introducidos por el usuario en planificación y seguimiento diarios.
- Reutilizar alimentos y preparaciones para reducir el costo de registrar un día.
- Mantener separados el plan futuro y el consumo histórico.
- Generar una lista de compras editable a partir de un intervalo planificado.
- Mantener cálculos deterministas y validar referencias entre entidades.
- Preservar workspaces existentes y el flujo de sincronización actual.
- Comunicar claramente que el módulo registra información y no realiza diagnóstico ni prescripción.

**Non-Goals:**

- Calcular una dieta recomendada a partir de datos corporales o condiciones médicas.
- Gestionar pacientes, profesionales, consultas o planes compartidos.
- Consultar bases alimentarias, códigos de barras, IA, wearables o servicios externos.
- Registrar fotografías o mediciones corporales en la primera versión.
- Descontar inventario doméstico o crear movimientos financieros automáticamente.
- Resolver edición concurrente o paginar el documento JSON del workspace.

## Decisions

### Mantener el dominio nutricional separado

Los tipos, constructores, validadores y cálculos residirán en `app/lib/nutrition.ts`. `WorkspaceData` incorporará:

- `nutritionProfile: NutritionProfile | null`
- `nutritionFoods: NutritionFood[]`
- `nutritionRecipes: NutritionRecipe[]`
- `nutritionPlanItems: NutritionPlanItem[]`
- `nutritionIntakeEntries: NutritionIntakeEntry[]`
- `nutritionHydrationEntries: NutritionHydrationEntry[]`
- `nutritionShoppingLists: NutritionShoppingList[]`

El perfil será único porque el workspace actual representa a una sola persona autenticada. Separar las colecciones simplifica la edición y permite normalizar referencias huérfanas. Embutir todo dentro del perfil produciría actualizaciones profundas y migraciones más frágiles.

### Usar enteros en milésimas para cantidades y nutrientes

Las cantidades de alimentos, kilocalorías y gramos nutricionales se persistirán como enteros en milésimas de su unidad (`quantityMilli`, `energyKcalMilli`, `proteinGramsMilli`, etc.). El agua se almacenará como mililitros enteros. La UI convertirá valores decimales a enteros al guardar y redondeará únicamente al presentar.

Esto evita deriva de punto flotante y permite cantidades como media porción. Guardar números decimales directamente sería más simple, pero haría que sumas repetidas produjeran resultados inconsistentes. `bigint` se descarta porque no se serializa directamente a JSON.

### Modelar cada alimento con una unidad de referencia

Cada alimento tendrá nombre, cantidad de referencia positiva, unidad (`g`, `ml` o `unit`) y nutrientes correspondientes a esa referencia. Toda cantidad que use ese alimento deberá expresarse en la misma unidad. Una preparación contendrá ingredientes con `foodId` y cantidad; además tendrá nombre y número positivo de porciones.

No se convertirán automáticamente gramos, mililitros y unidades porque esa conversión necesita densidad o peso por unidad, información que no siempre existe. El usuario podrá crear alimentos separados cuando necesite referencias diferentes.

### Calcular preparaciones y planes, pero congelar el consumo histórico

Los nutrientes de una preparación y de un elemento planificado se calcularán desde la biblioteca vigente. Un registro de consumo almacenará su descripción, cantidad y una instantánea de los nutrientes totales en el momento de registrarlo, además de una referencia opcional al alimento, preparación o elemento planificado de origen.

Así, corregir un alimento actualiza planes futuros y preparaciones, pero no reescribe lo que el usuario consumió en fechas anteriores. Mantener solamente referencias habría sido más pequeño, pero convertiría una edición de catálogo en una alteración retroactiva del historial.

### Representar plan y consumo como hechos distintos

`NutritionPlanItem` tendrá fecha, tipo de comida (`breakfast`, `lunch`, `snack`, `dinner` u `other`), referencia a alimento o preparación y multiplicador de porciones. `NutritionIntakeEntry` tendrá fecha, tipo de comida, instantánea nutricional y origen opcional. Copiar una comida planificada al consumo creará un registro; no cambiará el estado del elemento planificado.

Esta separación permite comparar planificado con consumido sin estados ambiguos y admitir consumos no planificados.

### Tratar los objetivos como datos manuales y opcionales

El perfil podrá guardar objetivos diarios positivos de energía, proteínas, carbohidratos, grasas, fibra y agua, junto con preferencias, alergias e intolerancias como listas de texto. Todos los objetivos serán opcionales y no se inferirán de peso, edad, sexo o patologías. El progreso solo se mostrará para objetivos configurados y la interfaz incluirá una aclaración de alcance no médico.

### Generar listas de compras como instantáneas editables

La generación para un intervalo recorrerá los elementos planificados, expandirá preparaciones, agrupará alimentos por `foodId` y unidad, y guardará una `NutritionShoppingList` con sus elementos resultantes. Cada elemento conservará etiqueta y cantidad como instantánea, podrá marcarse, editarse o eliminarse, y la lista aceptará elementos manuales sin `foodId`.

La lista no se recalculará automáticamente cuando cambie el plan. El usuario deberá regenerarla confirmando el reemplazo, lo que evita perder marcas o ajustes sin aviso. Descontar existencias domésticas queda fuera del alcance.

### Aplicar reglas explícitas de eliminación

- Un alimento usado por una preparación o un plan no podrá eliminarse hasta quitar esas referencias.
- Una preparación usada por un plan no podrá eliminarse hasta quitar esas referencias.
- Los registros históricos y listas de compras conservarán instantáneas y no bloquearán eliminaciones.
- Los elementos planificados y registros de consumo podrán eliminarse individualmente con confirmación en la UI cuando corresponda.

Bloquear referencias activas evita cascadas amplias y pérdida accidental de planes. Las instantáneas desacoplan correctamente historial y compras.

### Integrar una vista nutricional con cuatro superficies

La navegación añadirá `nutrition` y la vista dedicada se dividirá en:

1. **Hoy:** comidas planificadas, consumo, hidratación y progreso.
2. **Plan semanal:** navegación por semana y edición de comidas.
3. **Biblioteca:** alimentos y preparaciones.
4. **Compras:** generación y edición de listas.

El perfil y los objetivos se editarán desde una acción secundaria de la vista. Esta separación mantiene el panel cotidiano pequeño y evita expandir aún más el componente monolítico del gestor de tareas.

### Extender la frontera de compatibilidad existente

`emptyWorkspace`, serialización, hidratación, detección de contenido y `normalizeWorkspaceData` incluirán los nuevos campos. Los workspaces que no los contengan recibirán perfil nulo y colecciones vacías. La normalización validará enteros seguros, fechas, unidades, tipos de comida y referencias, descartando entidades inválidas o huérfanas en orden de dependencia.

No se requiere modificar el esquema de PocketBase porque el backend persiste un documento JSON opaco. Se mantiene la semántica actual de última escritura ganadora.

## Risks / Trade-offs

- **[El documento único puede crecer con registros diarios]** → Mantener operaciones lineales y limitar las listas visibles por fecha; migrar a colecciones dedicadas solo si el volumen real lo exige.
- **[La unidad fija de un alimento limita conversiones]** → Hacer visible la unidad en todos los formularios y no realizar conversiones implícitas.
- **[Editar la biblioteca modifica totales de planes futuros]** → Conservar instantáneas en el consumo y comunicar que el plan siempre usa los valores actuales.
- **[Regenerar compras puede borrar ajustes]** → Solicitar confirmación y no regenerar automáticamente.
- **[Los objetivos pueden interpretarse como indicación médica]** → Exigir entrada manual y mostrar una aclaración persistente de alcance.
- **[La vista nutricional aumenta el tamaño del estado sincronizado]** → Mantener el dominio y la UI aislados para facilitar una migración posterior.
- **[La eliminación bloqueada puede resultar incómoda]** → Informar exactamente qué preparaciones o planes usan la entidad y permitir navegar a ellos.

## Migration Plan

1. Incorporar tipos y normalización que acepten tanto workspaces anteriores como workspaces nutricionales.
2. Extender persistencia local/remota y detección de contenido antes de exponer acciones de edición.
3. Añadir operaciones del hook y cálculos de dominio con pruebas.
4. Incorporar la vista Nutrición y sus cuatro superficies.
5. Verificar que cargar y volver a guardar un workspace anterior conserva tareas, asuntos, eventos y finanzas, añadiendo únicamente valores nutricionales vacíos.

El rollback puede ocultar la vista y retirar las operaciones sin borrar los campos JSON ya persistidos. Una versión anterior ignorará esos campos; una versión posterior podrá recuperarlos.

## Open Questions

Ninguna para el MVP. La integración opcional con tareas, inventario doméstico, finanzas y mediciones corporales se evaluará en cambios posteriores.

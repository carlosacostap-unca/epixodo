## ADDED Requirements

### Requirement: Perfil y objetivos nutricionales manuales
El sistema SHALL permitir que el usuario cree y edite un único perfil nutricional con objetivos diarios opcionales de energía, proteínas, carbohidratos, grasas, fibra y agua, además de preferencias, alergias e intolerancias. El sistema MUST exigir valores positivos para cada objetivo configurado y MUST identificar estos valores como datos introducidos por el usuario, no como diagnóstico o prescripción.

#### Scenario: Guardar un perfil válido
- **WHEN** el usuario guarda objetivos válidos y listas de preferencias o restricciones
- **THEN** el sistema persiste el perfil y usa los objetivos configurados en los resúmenes diarios

#### Scenario: Omitir objetivos
- **WHEN** el usuario deja uno o más objetivos sin configurar
- **THEN** el sistema guarda el perfil y no muestra progreso para los objetivos ausentes

#### Scenario: Rechazar un objetivo inválido
- **WHEN** el usuario intenta guardar un objetivo igual o menor que cero
- **THEN** el sistema rechaza el valor y conserva el perfil anterior

### Requirement: Biblioteca de alimentos
El sistema SHALL permitir crear, editar y eliminar alimentos con nombre, cantidad de referencia positiva, unidad de referencia y valores no negativos de energía, proteínas, carbohidratos, grasas y fibra. La unidad MUST ser gramos, mililitros o unidades y todos los valores persistidos MUST utilizar representación entera determinista.

#### Scenario: Crear un alimento
- **WHEN** el usuario introduce un nombre, una referencia válida y valores nutricionales válidos
- **THEN** el sistema añade el alimento a la biblioteca y lo ofrece para preparaciones y planes

#### Scenario: Rechazar valores nutricionales inválidos
- **WHEN** el usuario intenta guardar un alimento con cantidad de referencia no positiva o un nutriente negativo
- **THEN** el sistema no guarda el alimento y muestra el campo inválido

#### Scenario: Impedir eliminar un alimento referenciado
- **WHEN** el usuario intenta eliminar un alimento utilizado por una preparación o elemento planificado
- **THEN** el sistema bloquea la eliminación e identifica las referencias que deben resolverse

### Requirement: Preparaciones reutilizables
El sistema SHALL permitir crear, editar y eliminar preparaciones con nombre, número positivo de porciones y uno o más ingredientes que referencien alimentos y cantidades válidas en sus respectivas unidades. El sistema SHALL calcular los nutrientes totales y por porción desde los valores vigentes de sus ingredientes.

#### Scenario: Calcular una preparación
- **WHEN** el usuario guarda una preparación con ingredientes válidos y cantidad de porciones
- **THEN** el sistema muestra los nutrientes totales y por porción calculados desde los alimentos referenciados

#### Scenario: Actualizar el cálculo de una preparación
- **WHEN** el usuario modifica los nutrientes de un alimento incluido en una preparación
- **THEN** el sistema recalcula los valores actuales de la preparación sin modificar consumos históricos

#### Scenario: Impedir eliminar una preparación planificada
- **WHEN** el usuario intenta eliminar una preparación utilizada por un elemento planificado
- **THEN** el sistema bloquea la eliminación e identifica los elementos que la utilizan

### Requirement: Planificación semanal de comidas
El sistema SHALL permitir crear, editar, copiar y eliminar elementos planificados para una fecha y tipo de comida, referenciando un alimento o una preparación y una cantidad positiva de porciones. El sistema SHALL agrupar los elementos por semana, fecha y tipo de comida y SHALL calcular sus totales con los valores actuales de la biblioteca.

#### Scenario: Añadir una comida al plan
- **WHEN** el usuario selecciona una fecha, tipo de comida, alimento o preparación y cantidad válida
- **THEN** el sistema incorpora el elemento al día correspondiente y actualiza los totales planificados

#### Scenario: Copiar un elemento a otro día
- **WHEN** el usuario copia un elemento planificado a una fecha de destino
- **THEN** el sistema crea un elemento independiente con el mismo contenido en la fecha indicada

#### Scenario: Navegar entre semanas
- **WHEN** el usuario cambia la semana visible
- **THEN** el sistema muestra únicamente los elementos pertenecientes a esa semana sin alterar el plan

### Requirement: Registro separado del consumo real
El sistema SHALL mantener el consumo real separado del plan y SHALL permitir registrar un consumo desde un elemento planificado o como entrada independiente. Cada entrada MUST conservar una instantánea de descripción, cantidad y nutrientes totales en el momento de registro y MAY conservar una referencia al origen.

#### Scenario: Registrar una comida planificada como consumida
- **WHEN** el usuario registra un elemento planificado como consumo real
- **THEN** el sistema crea una entrada histórica con una instantánea de sus valores y mantiene intacto el elemento planificado

#### Scenario: Registrar un consumo no planificado
- **WHEN** el usuario registra directamente un alimento o preparación para una fecha y tipo de comida
- **THEN** el sistema añade la entrada al consumo real sin crear un elemento planificado

#### Scenario: Preservar el historial ante cambios de catálogo
- **WHEN** el usuario modifica o elimina posteriormente el alimento o preparación de origen
- **THEN** las cantidades y nutrientes de la entrada de consumo permanecen sin cambios

### Requirement: Registro de hidratación
El sistema SHALL permitir registrar, editar y eliminar consumos de agua en mililitros positivos para una fecha y SHALL calcular el total diario.

#### Scenario: Añadir agua consumida
- **WHEN** el usuario registra una cantidad positiva de agua para una fecha
- **THEN** el sistema suma esa cantidad al total de hidratación del día

#### Scenario: Rechazar hidratación inválida
- **WHEN** el usuario intenta registrar cero o una cantidad negativa de agua
- **THEN** el sistema rechaza la entrada y mantiene el total anterior

### Requirement: Panel nutricional diario
El sistema SHALL mostrar para una fecha las comidas planificadas, el consumo real, la hidratación y los totales de energía y nutrientes. Para cada objetivo configurado, el sistema SHALL mostrar el valor consumido y su progreso, manteniendo separados los totales planificados y consumidos.

#### Scenario: Consultar el día actual
- **WHEN** el usuario abre la vista Nutrición
- **THEN** el sistema muestra el día actual con su plan, consumo, hidratación y progreso disponible

#### Scenario: Superar un objetivo
- **WHEN** el consumo real supera un objetivo configurado
- **THEN** el sistema muestra el valor real completo y un progreso de exceso comprensible sin truncar el total

#### Scenario: Día sin registros
- **WHEN** la fecha seleccionada no contiene plan, consumo ni hidratación
- **THEN** el sistema muestra un estado vacío con acciones para planificar o registrar

### Requirement: Lista de compras derivada y editable
El sistema SHALL generar bajo confirmación una lista de compras para un intervalo de fechas expandiendo preparaciones y agrupando cantidades planificadas por alimento y unidad. La lista generada SHALL ser una instantánea editable con elementos marcables y SHALL admitir elementos manuales sin referencia a un alimento.

#### Scenario: Generar compras desde un plan
- **WHEN** el usuario selecciona un intervalo con comidas planificadas y solicita generar la lista
- **THEN** el sistema expande las preparaciones, consolida alimentos repetidos y guarda la nueva lista con su intervalo

#### Scenario: Editar una lista generada
- **WHEN** el usuario cambia una cantidad, marca un elemento o agrega un artículo manual
- **THEN** el sistema persiste el ajuste sin modificar alimentos, preparaciones ni el plan

#### Scenario: Cambiar el plan después de generar
- **WHEN** el usuario modifica el plan que originó una lista existente
- **THEN** el sistema conserva la lista sin cambios hasta que el usuario solicite regenerarla

#### Scenario: Regenerar una lista ajustada
- **WHEN** el usuario solicita regenerar una lista existente
- **THEN** el sistema pide confirmación antes de reemplazar sus artículos y marcas

### Requirement: Navegación nutricional
El sistema SHALL ofrecer Nutrición como una vista principal del workspace autenticado y SHALL organizarla en superficies para Hoy, Plan semanal, Biblioteca y Compras, con acceso secundario al perfil y objetivos.

#### Scenario: Abrir el módulo nutricional
- **WHEN** el usuario activa Nutrición desde la navegación principal
- **THEN** el sistema muestra el panel de Hoy y permite cambiar entre sus superficies sin salir del workspace

### Requirement: Persistencia y compatibilidad del workspace
El sistema SHALL guardar el perfil y todas las colecciones nutricionales mediante la persistencia local y remota existente. La normalización MUST convertir campos nutricionales ausentes en valores vacíos seguros y MUST descartar entidades malformadas o referencias activas huérfanas sin dañar los restantes dominios del workspace.

#### Scenario: Cargar un workspace anterior
- **WHEN** el sistema carga datos que no contienen campos nutricionales
- **THEN** inicializa perfil nulo y colecciones nutricionales vacías preservando tareas, asuntos, eventos y finanzas

#### Scenario: Sincronizar datos nutricionales
- **WHEN** el usuario modifica información nutricional válida
- **THEN** el sistema la guarda localmente y la incluye en la sincronización remota del workspace

#### Scenario: Normalizar referencias inválidas
- **WHEN** los datos persistidos contienen una preparación o plan con referencias activas inexistentes
- **THEN** el sistema descarta la entidad inválida y conserva las entidades válidas y las instantáneas históricas

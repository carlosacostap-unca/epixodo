## Why

Epixodo permite organizar tareas, asuntos y finanzas personales, pero no ofrece un espacio para convertir objetivos alimentarios en un plan cotidiano y verificable. Un módulo nutricional personal permite planificar comidas, registrar lo realmente consumido y preparar compras dentro del mismo workspace, sin pretender sustituir la orientación de un profesional de la salud.

## What Changes

- Añadir una opción principal **Nutrición** al workspace autenticado.
- Permitir configurar un perfil nutricional personal con objetivos diarios manuales de energía, macronutrientes y agua, además de preferencias, alergias e intolerancias.
- Permitir crear, editar y eliminar alimentos con una porción de referencia y valores de energía, proteínas, carbohidratos, grasas y fibra.
- Permitir crear preparaciones reutilizables compuestas por alimentos y cantidades, calculando sus valores nutricionales por porción.
- Incorporar un planificador semanal con comidas configurables por fecha y tipo de comida, basado en alimentos o preparaciones reutilizables.
- Diferenciar lo planificado de lo realmente consumido y permitir registrar el consumo mediante una copia rápida del plan o mediante entradas independientes.
- Mostrar un panel diario con comidas, agua y progreso respecto de los objetivos nutricionales, sin presentar cálculos como diagnóstico o prescripción médica.
- Generar una lista de compras consolidada a partir de un intervalo del plan, permitiendo marcar artículos, ajustar cantidades y añadir elementos manuales.
- Persistir y normalizar todos los datos nutricionales mediante el flujo local y PocketBase existente, conservando la compatibilidad con workspaces anteriores.
- Dejar fuera de este primer alcance la gestión profesional de pacientes, recomendaciones automáticas, bases alimentarias externas, códigos de barras, fotografías, wearables y vinculación automática con movimientos financieros.

## Capabilities

### New Capabilities

- `personal-nutrition-management`: Gestionar perfil y objetivos nutricionales, biblioteca de alimentos y preparaciones, planificación semanal, consumo real, hidratación, resumen diario y lista de compras derivada.

### Modified Capabilities

Ninguna.

## Impact

- Extiende `WorkspaceData`, su normalización, persistencia local, sincronización remota y detección de contenido con nuevas colecciones y preferencias nutricionales.
- Añade un dominio nutricional separado con validadores, constructores y cálculos derivados.
- Añade una vista nutricional al shell autenticado y operaciones de estado al hook del workspace.
- Requiere cobertura para cálculos nutricionales, consistencia de recetas y planes, generación de compras, eliminación en cascada y compatibilidad con datos existentes.
- No requiere inicialmente nuevas colecciones de PocketBase ni servicios externos, porque los datos continúan almacenándose en el documento JSON del workspace.

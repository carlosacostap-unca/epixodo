## Why

Epixodo organiza acciones y registros, pero hoy no ofrece un lugar persistente para pensar en voz alta, contar cómo transcurre el día o conversar sobre emociones y pensamientos sin convertirlos automáticamente en tareas. Una compañía conversacional integrada permite conservar esas charlas, retomarlas por tema y recibir respuestas atentas de la misma IA que ya usa la aplicación.

## What Changes

- Añadir una sección principal llamada “Compañía” con una experiencia de conversación personal.
- Permitir crear, titular, retomar, renombrar y eliminar conversaciones independientes.
- Guardar de forma persistente los mensajes de la persona y de la IA, aislados por usuario.
- Enviar a la IA el contexto reciente de la conversación y una instrucción de tono cálido, honesto y no clínico.
- Incluir estados de carga y error, diseño adaptable, accesibilidad por teclado y una experiencia inicial que sugiera temas sin imponer categorías.
- Detectar indicios explícitos de peligro inmediato en la respuesta de la IA para priorizar seguridad y ayuda humana urgente, sin presentar la función como terapia ni atención de emergencias.

## Capabilities

### New Capabilities

- `personal-ai-companion`: Conversaciones personales persistentes por tema, generación contextual de respuestas y salvaguardas de bienestar.

### Modified Capabilities

Ninguna.

## Impact

- Nueva vista React y entrada en la navegación principal.
- Nuevos Route Handlers autenticados para conversaciones y mensajes.
- Nuevos módulos de dominio, cliente de IA y persistencia en PocketBase.
- Nuevas colecciones normalizadas de PocketBase para conversaciones y mensajes, junto con validación y pruebas.
- Uso de la configuración OpenAI existente mediante una variable de modelo específica y sin almacenamiento remoto de respuestas.

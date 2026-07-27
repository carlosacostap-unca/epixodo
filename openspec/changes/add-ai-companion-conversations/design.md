## Context

Epixodo es una aplicación personal autenticada construida con Next.js 16, React 19, Route Handlers y PocketBase normalizado. La IA actual procesa capturas puntuales sin conservar una conversación. Esta función necesita un ciclo distinto: cargar hilos, conservar mensajes en orden, generar una respuesta con contexto limitado y actualizar la interfaz sin mezclar el contenido íntimo con tareas u otros registros.

La persona usuaria es alguien que ya usa Epixodo como espacio cotidiano. El trabajo único de la vista es ofrecerle un lugar sereno para decir algo y sentirse escuchada, pudiendo retomar el tema luego.

## Goals / Non-Goals

**Goals:**

- Mantener múltiples conversaciones persistentes, privadas por propietario y fáciles de retomar.
- Generar respuestas en español rioplatense con un tono cálido, concreto, curioso y no sentencioso.
- Conservar suficiente historial para continuidad sin crecer indefinidamente en cada solicitud a OpenAI.
- Integrar la experiencia en la navegación, lenguaje visual, accesibilidad y comportamiento adaptable de Epixodo.
- Hacer explícitos los límites de la herramienta y dar prioridad a ayuda humana ante peligro inmediato.

**Non-Goals:**

- Diagnosticar, tratar o reemplazar atención psicológica o médica.
- Crear tareas, registrar estados de ánimo estructurados o extraer automáticamente datos de otras secciones.
- Sincronizar con servicios externos, admitir adjuntos o transmitir respuestas en tiempo real en esta primera versión.
- Dar a la IA acceso global al resto del espacio personal.

## Decisions

1. **Persistencia separada en dos colecciones normalizadas.** `companion_conversations` conserva identidad y título del hilo; `companion_messages` conserva rol, contenido y relación. Esto evita inflar el documento de workspace y permite ordenar/cargar mensajes sin reescribir todo el espacio. La alternativa de guardar un JSON dentro del workspace es más simple, pero contradice la migración normalizada actual y aumenta el riesgo de conflictos de guardado.

2. **Un endpoint transaccional de conversación.** Un `POST /api/companion/messages` valida la sesión y el texto, crea la conversación cuando haga falta, guarda el mensaje humano, llama a OpenAI y guarda la respuesta. Si OpenAI falla, el mensaje humano permanece guardado y el cliente recibe un error recuperable. Los endpoints de conversaciones cubren listado, renombrado y eliminación.

3. **Contexto acotado y armado en servidor.** Se enviarán a OpenAI los últimos 24 mensajes del hilo, con un máximo agregado de caracteres. El servidor vuelve a consultar los mensajes por propietario y conversación; no confía en historial enviado por el navegador. Se usa `store: false` y `OPENAI_COMPANION_MODEL`, con fallback al modelo configurado para capturas.

4. **Título automático determinista.** Al crear un hilo se usa una versión breve y limpia del primer mensaje como título; la persona puede renombrarlo. Esto evita una segunda llamada de IA y hace que el primer envío se sienta inmediato.

5. **Salvaguardas en la instrucción, no diagnóstico local.** La instrucción pide reconocer expresiones claras de peligro inmediato, responder con empatía, alentar contacto con emergencias o una persona de confianza y preguntar por seguridad inmediata. No se etiquetan emociones ni se bloquea el mensaje mediante reglas frágiles en el cliente.

6. **Dirección visual: “un hilo encendido dentro del espacio”.** Se conserva la base azul nocturna de Epixodo y se añade un acento violeta suave (`#b7a6ff`) solo en Compañía. El elemento distintivo es una línea vertical luminosa que conecta los mensajes y funciona como metáfora de continuidad, rodeada por superficies sobrias. La tipografía existente permanece para preservar identidad; el ancho de lectura se limita para que la conversación se sienta íntima y legible. En escritorio habrá lista de hilos y conversación; en móvil se apilan sin ocultar acciones esenciales.

## Risks / Trade-offs

- **[Contenido emocional sensible]** → Mostrar límites con lenguaje no alarmista, instruir una respuesta de seguridad ante peligro inmediato y no presentar la función como profesional de salud.
- **[Exposición cruzada de datos]** → Filtrar todas las consultas por `owner`, verificar pertenencia del hilo en cada operación y mantener reglas de colección por usuario.
- **[Costos y latencia crecientes]** → Limitar longitud del mensaje e historial; no generar títulos con otra llamada.
- **[Fallo después de guardar el mensaje humano]** → Mantener ese mensaje para no perder lo escrito y permitir reintentar con un nuevo envío; no inventar una respuesta local.
- **[Eliminación irreversible de un hilo]** → Solicitar confirmación explícita en la interfaz y eliminar primero los mensajes relacionados.
- **[Dependencia de nuevas colecciones]** → Extender el manifiesto y script de esquema, validar antes de desplegar y mantener los cambios aditivos para que el rollback de código no afecte otros módulos.

## Migration Plan

1. Crear o actualizar las colecciones `companion_conversations` y `companion_messages` con índices por propietario, cliente, conversación y fecha.
2. Desplegar el código del servidor y luego la interfaz; al ser una capacidad nueva no requiere migración de datos existentes.
3. Verificar aislamiento, creación, lectura, renombrado, eliminación y una conversación real con la configuración OpenAI del entorno.
4. Para rollback, retirar la navegación y endpoints. Las colecciones pueden conservarse sin afectar las demás funciones; su borrado posterior sería una operación separada y explícita.

## Open Questions

- El nombre visible “Compañía” se adopta como punto de partida y puede cambiarse sin modificar contratos ni datos.
- El resumen de conversaciones antiguas y la conversión voluntaria de mensajes en tareas quedan para cambios posteriores.

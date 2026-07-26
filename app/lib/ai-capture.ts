export const MAX_CAPTURE_TEXT_LENGTH = 12_000;
export const MAX_CAPTURE_AUDIO_BYTES = 15 * 1024 * 1024;

export type CaptureResult = {
  title: string;
  notes: string;
  sourceText: string;
};

type OpenAIResponse = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      type?: unknown;
      text?: unknown;
    }>;
  }>;
  error?: { message?: unknown };
};

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no está configurada en el servidor.");
  }

  return apiKey;
}

function getOutputText(payload: OpenAIResponse) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function cleanSingleLine(value: unknown, maximumLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maximumLength)
    : "";
}

export function normalizeCaptureResult(value: unknown, sourceText: string): CaptureResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const title = cleanSingleLine(candidate.title, 120);
  const notes = typeof candidate.notes === "string" ? candidate.notes.trim().slice(0, 8_000) : "";

  if (!title) {
    return null;
  }

  return {
    title,
    notes,
    sourceText: sourceText.trim(),
  };
}

async function openAIRequest(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as OpenAIResponse | null;

  if (!response.ok) {
    const detail = typeof payload?.error?.message === "string" ? payload.error.message : "";
    throw new Error(detail || `OpenAI respondió con estado ${response.status}.`);
  }

  return payload;
}

export async function transcribeCaptureAudio(file: File) {
  if (file.size === 0) {
    throw new Error("La grabación está vacía.");
  }

  if (file.size > MAX_CAPTURE_AUDIO_BYTES) {
    throw new Error("La grabación supera el límite de 15 MB.");
  }

  const formData = new FormData();
  formData.set("file", file, file.name || "ingreso.webm");
  formData.set("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe");
  formData.set("language", "es");
  formData.set(
    "prompt",
    "Transcribí con fidelidad en español rioplatense. Conservá nombres, fechas, importes y acciones.",
  );

  const payload = (await openAIRequest("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    body: formData,
  })) as OpenAIResponse & { text?: unknown };
  const text = typeof payload.text === "string" ? payload.text.trim() : "";

  if (!text) {
    throw new Error("No se pudo obtener texto de la grabación.");
  }

  return text;
}

export async function processCaptureText(sourceText: string): Promise<CaptureResult> {
  const input = sourceText.trim();

  if (!input) {
    throw new Error("Ingresá algo para procesar.");
  }

  if (input.length > MAX_CAPTURE_TEXT_LENGTH) {
    throw new Error("El texto supera el límite de 12.000 caracteres.");
  }

  const payload = await openAIRequest("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_CAPTURE_MODEL || "gpt-5.6-luna",
      store: false,
      instructions:
        "Convertí una captura personal sin organizar en una entrada clara para una bandeja de tareas. " +
        "No inventes fechas, compromisos ni datos. El título debe ser breve y accionable si hay una acción; " +
        "si es una idea o referencia, describila con claridad. En las notas conservá todos los detalles concretos " +
        "que sirvan para revisarla manualmente después. Respondé en español.",
      input,
      text: {
        format: {
          type: "json_schema",
          name: "captura_bandeja",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string", description: "Título claro de hasta 120 caracteres." },
              notes: { type: "string", description: "Detalles útiles para la revisión manual." },
            },
            required: ["title", "notes"],
          },
        },
      },
    }),
  });
  const outputText = payload ? getOutputText(payload) : "";

  try {
    const result = normalizeCaptureResult(JSON.parse(outputText), input);
    if (result) {
      return result;
    }
  } catch {
    // The error below gives the caller a stable, user-facing failure message.
  }

  throw new Error("La IA no devolvió una entrada válida para la bandeja.");
}

import type { TaskAiSuggestion } from "./tasks";

export const MAX_CAPTURE_TEXT_LENGTH = 12_000;
export const MAX_CAPTURE_AUDIO_BYTES = 15 * 1024 * 1024;

export type CaptureResult = {
  title: string;
  notes: string;
  sourceText: string;
  suggestion: TaskAiSuggestion | null;
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

function isCaptureDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizeCaptureResult(value: unknown, sourceText: string): CaptureResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const title = cleanSingleLine(candidate.title, 120);
  const notes = typeof candidate.notes === "string" ? candidate.notes.trim().slice(0, 8_000) : "";
  const rawSuggestion = candidate.suggestion;
  let suggestion: TaskAiSuggestion | null = null;

  if (rawSuggestion && typeof rawSuggestion === "object") {
    const item = rawSuggestion as Record<string, unknown>;
    const date = (key: string) => isCaptureDate(item[key]) ? item[key] as string : null;
    const text = (key: string, max = 160) => cleanSingleLine(item[key], max);
    const whole = (key: string) => typeof item[key] === "number" ? Math.round(item[key] as number) : 0;
    const scaled = (key: string, scale: number) => typeof item[key] === "number" ? Math.round((item[key] as number) * scale) : 0;
    const amountMinor = scaled("amount", 100);
    const currency = text("currency", 3).toUpperCase();

    if ((item.type === "finance_entry" || item.type === "finance_expense") &&
        (item.kind === "income" || item.kind === "expense" || item.type === "finance_expense") &&
        amountMinor > 0 && Number.isSafeInteger(amountMinor) && /^[A-Z]{3}$/.test(currency) && text("description")) {
      suggestion = { type: "finance_entry", kind: item.type === "finance_expense" ? "expense" : item.kind as "income" | "expense",
        description: text("description"), amountMinor, currency, category: text("category", 80), date: date("date"),
        origin: text("origin", 120), destination: text("destination", 120) };
    } else if (item.type === "finance_due_payment" && amountMinor > 0 && /^[A-Z]{3}$/.test(currency) && text("description")) {
      suggestion = { type: "finance_due_payment", description: text("description"), amountMinor, currency,
        category: text("category", 80), dueDate: date("dueDate") };
    } else if (item.type === "task" && text("title") && ["low", "normal", "high"].includes(String(item.priority))) {
      suggestion = { type: "task", title: text("title", 120), notes: typeof item.notes === "string" ? item.notes.trim().slice(0, 8_000) : "",
        priority: item.priority as "low" | "normal" | "high", hacerEl: date("hacerEl"), venceEl: date("venceEl"), subjectName: text("subjectName", 120) };
    } else if (item.type === "subject_event" && ["milestone", "deadline"].includes(String(item.kind)) && text("description")) {
      suggestion = { type: "subject_event", kind: item.kind as "milestone" | "deadline", description: text("description"),
        date: date("date"), subjectName: text("subjectName", 120) };
    } else if (item.type === "location" && (text("plannedLocation") || text("actualLocation"))) {
      suggestion = { type: "location", date: date("date"), startTime: text("startTime", 5), endTime: text("endTime", 5),
        plannedLocation: text("plannedLocation", 160) || text("actualLocation", 160), actualLocation: text("actualLocation", 160), notes: text("notes", 500) };
    } else if (item.type === "nutrition_hydration" && whole("amountMl") > 0) {
      suggestion = { type: "nutrition_hydration", date: date("date"), amountMl: whole("amountMl") };
    } else if (item.type === "nutrition_intake" && text("description") && scaled("quantity", 1000) > 0 &&
        ["breakfast", "lunch", "snack", "dinner", "other"].includes(String(item.mealType))) {
      suggestion = { type: "nutrition_intake", date: date("date"), mealType: item.mealType as "breakfast" | "lunch" | "snack" | "dinner" | "other",
        description: text("description"), quantityMilli: scaled("quantity", 1000), unitLabel: text("unitLabel", 40) || "porción",
        energyKcalMilli: Math.max(0, scaled("energyKcal", 1000)), proteinGramsMilli: Math.max(0, scaled("proteinGrams", 1000)),
        carbsGramsMilli: Math.max(0, scaled("carbsGrams", 1000)), fatGramsMilli: Math.max(0, scaled("fatGrams", 1000)),
        fiberGramsMilli: Math.max(0, scaled("fiberGrams", 1000)) };
    } else if (item.type === "expectation" && text("title")) {
      const quantity = item.quantity === null ? null : whole("quantity");
      suggestion = { type: "expectation", title: text("title", 120),
        notes: typeof item.notes === "string" ? item.notes.trim().slice(0, 8_000) : "",
        expectedDate: date("expectedDate"), quantity: quantity && quantity > 0 ? quantity : null,
        source: text("source", 120) };
    }
  }

  if (!title) {
    return null;
  }

  return {
    title,
    notes,
    sourceText: sourceText.trim(),
    suggestion,
  };
}

const nullableDateSchema = { type: ["string", "null"], description: "Fecha YYYY-MM-DD o null." };
const captureSuggestionSchemas = [
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "task" }, title: { type: "string" }, notes: { type: "string" },
      priority: { type: "string", enum: ["low", "normal", "high"] }, hacerEl: nullableDateSchema,
      venceEl: nullableDateSchema, subjectName: { type: "string", description: "Asunto sugerido o texto vacío." },
    },
    required: ["type", "title", "notes", "priority", "hacerEl", "venceEl", "subjectName"],
  },
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "finance_entry" }, kind: { type: "string", enum: ["income", "expense"] },
      description: { type: "string" }, amount: { type: "number", description: "Importe en unidades principales." },
      currency: { type: "string", description: "Código ISO de tres letras." }, category: { type: "string" },
      date: nullableDateSchema, origin: { type: "string" }, destination: { type: "string" },
    },
    required: ["type", "kind", "description", "amount", "currency", "category", "date", "origin", "destination"],
  },
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "finance_due_payment" }, description: { type: "string" },
      amount: { type: "number", description: "Importe en unidades principales." }, currency: { type: "string" },
      category: { type: "string" }, dueDate: nullableDateSchema,
    },
    required: ["type", "description", "amount", "currency", "category", "dueDate"],
  },
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "subject_event" }, kind: { type: "string", enum: ["milestone", "deadline"] },
      description: { type: "string" }, date: nullableDateSchema, subjectName: { type: "string" },
    },
    required: ["type", "kind", "description", "date", "subjectName"],
  },
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "location" }, date: nullableDateSchema,
      startTime: { type: "string", description: "Hora HH:mm o texto vacío." },
      endTime: { type: "string", description: "Hora HH:mm o texto vacío." },
      plannedLocation: { type: "string" }, actualLocation: { type: "string" }, notes: { type: "string" },
    },
    required: ["type", "date", "startTime", "endTime", "plannedLocation", "actualLocation", "notes"],
  },
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "nutrition_hydration" }, date: nullableDateSchema,
      amountMl: { type: "number", description: "Mililitros consumidos." },
    },
    required: ["type", "date", "amountMl"],
  },
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "nutrition_intake" }, date: nullableDateSchema,
      mealType: { type: "string", enum: ["breakfast", "lunch", "snack", "dinner", "other"] },
      description: { type: "string" }, quantity: { type: "number" }, unitLabel: { type: "string" },
      energyKcal: { type: "number" }, proteinGrams: { type: "number" }, carbsGrams: { type: "number" },
      fatGrams: { type: "number" }, fiberGrams: { type: "number" },
    },
    required: ["type", "date", "mealType", "description", "quantity", "unitLabel", "energyKcal", "proteinGrams", "carbsGrams", "fatGrams", "fiberGrams"],
  },
  {
    type: "object", additionalProperties: false,
    properties: {
      type: { type: "string", const: "expectation" }, title: { type: "string" }, notes: { type: "string" },
      expectedDate: nullableDateSchema, quantity: { type: ["integer", "null"] },
      source: { type: "string", description: "Empresa, persona u origen esperado, o texto vacío." },
    },
    required: ["type", "title", "notes", "expectedDate", "quantity", "source"],
  },
] as const;

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

export async function processCaptureText(
  sourceText: string,
  today = new Date().toLocaleDateString("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "America/Argentina/Buenos_Aires",
  }),
): Promise<CaptureResult> {
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
        "Convertí una captura personal sin organizar en un ítem claro para una bandeja universal. " +
        "No inventes fechas, compromisos ni datos. El título debe ser breve y accionable si hay una acción; " +
        "si es una idea o referencia, describila con claridad. En las notas conservá todos los detalles concretos " +
        "que sirvan para revisarla manualmente después. Respondé en español.",
      input:
        `Fecha actual: ${today}. Clasificá el contenido en task, finance_entry, finance_due_payment, ` +
        `subject_event, expectation, location, nutrition_hydration o nutrition_intake cuando haya datos suficientes. ` +
        `Usá expectation para entregas, respuestas, transferencias, resultados o hechos que la persona espera que ocurran, ` +
        `pero que no son una acción que deba realizar. ` +
        `Sugerí todos los campos que puedan inferirse, usá null o texto vacío para los desconocidos y no inventes hechos. ` +
        `Para pesos sin otro país indicado usá ARS. "Acabo de" implica la fecha actual. Si no corresponde a un tipo, ` +
        `devolvé suggestion null y conservá el contenido como nota para revisión.\n\nCaptura: ${input}`,
      text: {
        format: {
          type: "json_schema",
          name: "captura_bandeja",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              suggestion: {
                anyOf: [...captureSuggestionSchemas, { type: "null" }],
              },
              title: { type: "string", description: "Título claro de hasta 120 caracteres." },
              notes: { type: "string", description: "Detalles útiles para la revisión manual." },
            },
            required: ["title", "notes", "suggestion"],
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

import { getAuthenticatedUser } from "../../lib/auth";
import {
  MAX_CAPTURE_AUDIO_BYTES,
  MAX_CAPTURE_TEXT_LENGTH,
  processCaptureText,
  transcribeCaptureAudio,
} from "../../lib/ai-capture";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo procesar el ingreso.";
  const status = message.includes("configurada") ? 503 : message.includes("límite") ? 413 : 502;
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!(await getAuthenticatedUser())) {
    return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let sourceText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audio = formData.get("audio");

      if (!(audio instanceof File)) {
        return Response.json({ error: "Falta la grabación de voz." }, { status: 400 });
      }

      if (audio.size > MAX_CAPTURE_AUDIO_BYTES) {
        return Response.json({ error: "La grabación supera el límite de 15 MB." }, { status: 413 });
      }

      sourceText = await transcribeCaptureAudio(audio);
    } else {
      const payload = (await request.json().catch(() => null)) as { text?: unknown } | null;
      sourceText = typeof payload?.text === "string" ? payload.text.trim() : "";
    }

    if (!sourceText) {
      return Response.json({ error: "Ingresá texto o grabá una nota de voz." }, { status: 400 });
    }

    if (sourceText.length > MAX_CAPTURE_TEXT_LENGTH) {
      return Response.json(
        { error: "El texto supera el límite de 12.000 caracteres." },
        { status: 413 },
      );
    }

    return Response.json(await processCaptureText(sourceText));
  } catch (error) {
    return errorResponse(error);
  }
}

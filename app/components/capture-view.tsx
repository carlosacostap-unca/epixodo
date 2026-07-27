"use client";

import { useEffect, useRef, useState } from "react";
import type { CaptureResult } from "../lib/ai-capture";
import type { TaskDraft } from "../lib/tasks";

type CaptureMode = "text" | "voice";
type CaptureState = "idle" | "recording" | "processing" | "saved";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

async function getErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof payload?.error === "string" ? payload.error : "No se pudo procesar el ingreso.";
}

export default function CaptureView({
  onAddTask,
  onOpenInbox,
}: {
  onAddTask: (draft: TaskDraft) => void;
  onOpenInbox: () => void;
}) {
  const [mode, setMode] = useState<CaptureMode>("text");
  const [text, setText] = useState("");
  const [state, setState] = useState<CaptureState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [lastCapture, setLastCapture] = useState<CaptureResult | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (state !== "recording") {
      return;
    }

    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(
    () => () => {
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        if (recorderRef.current.state === "recording") recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  function saveResult(result: CaptureResult) {
    const original = result.sourceText.trim();
    const notes = result.notes.trim();

    onAddTask({
      title: result.title,
      notes: notes
        ? `${notes}\n\n— Captura original —\n${original}`
        : original,
      status: "pending",
      subjectIds: [],
      phaseId: null,
      parentTaskId: null,
      hacerEl: null,
      venceEl: null,
      priority: "normal",
      aiSuggestion: result.suggestion,
    });
    setLastCapture(result);
    setText("");
    setState("saved");
  }

  async function submitText() {
    if (!text.trim() || state === "processing") {
      return;
    }

    setError("");
    setState("processing");

    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      saveResult((await response.json()) as CaptureResult);
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "No se pudo procesar el texto.");
      setState("idle");
    }
  }

  async function processAudio(blob: Blob) {
    setError("");
    setState("processing");

    try {
      const formData = new FormData();
      const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
      formData.set("audio", blob, `ingreso.${extension}`);
      const response = await fetch("/api/capture", { method: "POST", body: formData });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      saveResult((await response.json()) as CaptureResult);
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "No se pudo procesar la voz.");
      setState("idle");
    }
  }

  async function startRecording() {
    setError("");
    setLastCapture(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio desde esta pantalla.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find(
        (type) => MediaRecorder.isTypeSupported(type),
      );
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      setSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        streamRef.current = null;
        void processAudio(blob);
      };
      recorder.start(500);
      setState("recording");
    } catch {
      setError("No se pudo acceder al micrófono. Revisá el permiso del navegador.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  const isProcessing = state === "processing";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
      <section className="relative overflow-hidden rounded-3xl border border-[#315177] bg-[radial-gradient(circle_at_88%_8%,rgba(130,175,255,0.16),transparent_32%),linear-gradient(145deg,#10233a,#0b1828_62%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-7">
        <div aria-hidden="true" className="absolute right-6 top-6 flex h-20 items-center gap-1 opacity-35">
          {[18, 32, 50, 68, 42, 74, 56, 28, 46].map((height, index) => (
            <span key={index} className="w-1 rounded-full bg-[#82afff]" style={{ height }} />
          ))}
        </div>

        <div className="relative">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#82afff]">
            Captura sin ordenar
          </p>
          <h3 className="mt-2 max-w-xl text-2xl font-black tracking-[-0.035em] text-[#f4f7fc] sm:text-3xl">
            Sacalo de tu cabeza. La bandeja lo guarda.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9fb0c9]">
            La IA convierte tu nota en un título claro y conserva los detalles para que la organices cuando quieras.
          </p>

          <div className="mt-7 inline-grid grid-cols-2 rounded-xl border border-[#304968] bg-[#091522]/70 p-1">
            {(["text", "voice"] as const).map((item) => (
              <button
                key={item}
                type="button"
                disabled={state === "recording" || isProcessing}
                onClick={() => {
                  setMode(item);
                  setError("");
                  setState("idle");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#82afff]/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === item ? "bg-[#82afff] text-[#07111f]" : "text-[#aebbd0] hover:bg-[#16283f]"
                }`}
              >
                {item === "text" ? "Texto" : "Voz"}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <div className="mt-5">
              <label htmlFor="capture-text" className="sr-only">Contenido para la bandeja</label>
              <textarea
                id="capture-text"
                value={text}
                disabled={isProcessing}
                maxLength={12_000}
                onChange={(event) => {
                  setText(event.target.value);
                  setError("");
                  if (state === "saved") setState("idle");
                }}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    void submitText();
                  }
                }}
                placeholder="Ej.: El martes preguntarle a Martina si ya tiene el presupuesto del viaje y revisar las opciones de vuelo que mandó por mail."
                className="min-h-52 w-full resize-y rounded-2xl border border-[#355273] bg-[#081522]/85 p-4 text-base leading-7 text-[#edf4ff] outline-none transition placeholder:text-[#5f7595] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15 disabled:opacity-65"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold text-[#7185a3]">
                  {text.length.toLocaleString("es-AR")} / 12.000 � Ctrl/? + Enter
                </span>
                <button
                  type="button"
                  disabled={!text.trim() || isProcessing}
                  onClick={() => void submitText()}
                  className="inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#82afff] px-5 py-3 text-sm font-black text-[#07111f] shadow-[0_12px_30px_rgba(130,175,255,0.2)] transition hover:-translate-y-0.5 hover:bg-[#a8c7ff] focus:outline-none focus:ring-2 focus:ring-[#82afff]/40 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  {isProcessing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07111f]/30 border-t-[#07111f]" /> : null}
                  {isProcessing ? "Procesando…" : "Procesar y guardar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid min-h-64 place-items-center rounded-2xl border border-[#355273] bg-[#081522]/85 p-6 text-center">
              <div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={state === "recording" ? stopRecording : () => void startRecording()}
                  aria-label={state === "recording" ? "Detener grabación" : "Comenzar grabación"}
                  className={`mx-auto grid h-24 w-24 place-items-center rounded-full border transition focus:outline-none focus:ring-4 focus:ring-[#82afff]/25 disabled:opacity-50 ${
                    state === "recording"
                      ? "animate-pulse border-[#ff8d81] bg-[#47201f] text-[#ffafa5] shadow-[0_0_0_12px_rgba(255,141,129,0.08)]"
                      : "border-[#4c75a8] bg-[#17345a] text-[#a8c7ff] shadow-[0_0_0_12px_rgba(130,175,255,0.06)] hover:scale-105 hover:bg-[#1e416d]"
                  }`}
                >
                  {isProcessing ? (
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#82afff]/25 border-t-[#82afff]" />
                  ) : state === "recording" ? (
                    <span className="h-7 w-7 rounded-md bg-current" />
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="8" y="3" width="8" height="13" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></svg>
                  )}
                </button>
                <p className="mt-5 text-lg font-black text-[#eef4ff]">
                  {isProcessing ? "Transcribiendo y organizando…" : state === "recording" ? formatDuration(seconds) : "Tocá para grabar"}
                </p>
                <p className="mt-1 text-sm text-[#7f93b0]">
                  {state === "recording" ? "Tocá otra vez para detener y guardar" : "Hablá con naturalidad; no hace falta dictar un formato."}
                </p>
                {state !== "recording" ? (
                  <div className="mt-5">
                    <input
                      id="capture-audio-file"
                      type="file"
                      accept="audio/*,.webm,.wav,.mp3,.m4a,.ogg,.mp4"
                      disabled={isProcessing}
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void processAudio(file);
                      }}
                    />
                    <label
                      htmlFor="capture-audio-file"
                      aria-disabled={isProcessing}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#3b5b80] px-4 py-2.5 text-sm font-black text-[#c9dcfa] transition hover:border-[#82afff] hover:bg-[#142b48] focus-within:ring-2 focus-within:ring-[#82afff]/30 ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 14v5h14v-5" /></svg>
                      Subir archivo de audio
                    </label>
                    <p className="mt-2 text-xs text-[#667d99]">Hasta 15 MB.</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {error ? (
            <p role="alert" className="mt-4 rounded-xl border border-[#7a3d32] bg-[#2e1716] px-4 py-3 text-sm font-semibold text-[#ffafa5]">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <aside className="rounded-3xl border border-[#293f5e] bg-[#0d1a2a] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:p-6">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7185a3]">Último ingreso</p>
        {lastCapture ? (
          <div className="mt-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2d674f] bg-[#102b23] px-3 py-1.5 text-xs font-black text-[#63d3a5]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Guardado en Bandeja
            </span>
            <h4 className="mt-5 text-xl font-black leading-tight text-[#f4f7fc]">{lastCapture.title}</h4>
            {lastCapture.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#9fb0c9]">{lastCapture.notes}</p> : null}
            {lastCapture.suggestion ? (
              <div className="mt-4 rounded-xl border border-[#3d6588] bg-[#10283b] px-4 py-3">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#7fd8d0]">
                  Tipo de ítem detectado
                </p>
                <p className="mt-1 text-sm font-bold text-[#dcebf5]">
                  La Bandeja incluirá un formulario con los campos sugeridos, listo para revisar y confirmar.
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onOpenInbox}
              className="mt-6 w-full rounded-xl border border-[#3b5b80] px-4 py-3 text-sm font-black text-[#c9dcfa] transition hover:border-[#82afff] hover:bg-[#142b48] focus:outline-none focus:ring-2 focus:ring-[#82afff]/30"
            >
              Abrir Bandeja
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#304968] bg-[#0a1726] p-5">
            <p className="text-sm font-bold text-[#b5c3d8]">Acá vas a ver el resultado.</p>
            <p className="mt-2 text-sm leading-6 text-[#7185a3]">
              Cada ingreso se guarda pendiente, sin asunto ni fecha. Nada se organiza por vos hasta que abras la Bandeja.
            </p>
          </div>
        )}
        <div className="mt-6 border-t border-[#243955] pt-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7f93b0]">Recorrido</p>
          <ol className="mt-3 grid gap-3 text-sm text-[#94a7c2]">
            <li className="flex gap-3"><span className="font-mono font-black text-[#82afff]">1</span><span>Ingresá texto o voz.</span></li>
            <li className="flex gap-3"><span className="font-mono font-black text-[#82afff]">2</span><span>La IA aclara el título y conserva el contexto.</span></li>
            <li className="flex gap-3"><span className="font-mono font-black text-[#82afff]">3</span><span>Vos decidís cómo procesarlo en Bandeja.</span></li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

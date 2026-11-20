"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CaptureResult } from "../../lib/ai-capture";
import { workspaceHref } from "../../lib/module-navigation";
import styles from "./capture.module.css";
import { useWorkspace, useWorkspaceDraft } from "../../components/workspace-provider";

type CaptureState = "idle" | "starting" | "recording" | "processing" | "saving" | "saved";

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

async function getErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof payload?.error === "string" ? payload.error : "No se pudo procesar la entrada. Intentá de nuevo.";
}

function RecordingWaveform({ stream }: { stream: MediaStream }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // The waveform follows the microphone signal, including silence.
    if (typeof AudioContext === "undefined") return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    void context.resume().catch(() => undefined);
    const samples = new Uint8Array(analyser.fftSize);
    const levels = Array<number>(36).fill(0);
    let frame = 0;
    let lastUpdate = 0;

    function draw(time: number) {
      const canvas = canvasRef.current;
      const pen = canvas?.getContext("2d");
      if (canvas && pen && time - lastUpdate > 50) {
        analyser.getByteTimeDomainData(samples);
        const energy = samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0);
        levels.shift();
        levels.push(Math.min(1, Math.sqrt(energy / samples.length) * 4));
        pen.clearRect(0, 0, canvas.width, canvas.height);
        pen.fillStyle = "#ffcb7e";
        levels.forEach((level, index) => {
          const height = Math.max(4, level * 76);
          pen.beginPath();
          pen.roundRect(index * 8 + 2, (80 - height) / 2, 4, height, 2);
          pen.fill();
        });
        lastUpdate = time;
      }
      frame = requestAnimationFrame(draw);
    }

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      void context.close().catch(() => undefined);
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={288} height={80} role="img" aria-label="Nivel de voz del micrófono en tiempo real" className="h-20 w-full max-w-72" />;
}

export default function CaptureComposer({ onCapture }: {
  onCapture: (capture: CaptureResult) => void;
}) {
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [text, setText] = useWorkspaceDraft("capture:composition", () => "");
  const { syncPending, syncError, isSaving, retrySync } = useWorkspace();
  const [state, setState] = useState<CaptureState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [preparedCapture, setPreparedCapture] = useState<CaptureResult | null>(null);
  const [hasTranscript, setHasTranscript] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [retryAudio, setRetryAudio] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const busyRef = useRef(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        recorderRef.current.onerror = null;
        if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (hasTranscript) editorRef.current?.focus();
  }, [hasTranscript]);

  async function processAudio(blob: Blob) {
    setError("");
    setState("processing");
    setRetryAudio(blob);
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      if (!blob.size) throw new Error("No se recibió audio. Volvé a grabar y revisá el micrófono.");
      if (blob.size > 15 * 1024 * 1024) throw new Error("La grabación supera los 15 MB. Grabá una nota más corta.");
      const formData = new FormData();
      const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
      formData.set("audio", blob, `ingreso.${extension}`);
      const response = await fetch("/api/capture", { method: "POST", body: formData, signal: controller.signal });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const result = (await response.json()) as CaptureResult;
      if (!mountedRef.current) return;
      setPreparedCapture(result);
      setText(result.sourceText);
      setHasTranscript(true);
      setRetryAudio(null);
    } catch (captureError) {
      if (!mountedRef.current || controller.signal.aborted) return;
      setError(captureError instanceof Error ? captureError.message : "No se pudo transcribir. Intentá de nuevo.");
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setState("idle");
    }
  }

  async function saveEntry() {
    if (!text.trim() || busyRef.current) return;
    busyRef.current = true;
    setError("");
    setState("saving");
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      let result = preparedCapture;
      // Rebuild the title and suggestions if the transcript was edited.
      if (!result || result.sourceText.trim() !== text.trim()) {
        const response = await fetch("/api/capture", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }), signal: controller.signal,
        });
        if (!response.ok) throw new Error(await getErrorMessage(response));
        result = (await response.json()) as CaptureResult;
      }
      if (!mountedRef.current) return;
      onCapture(result);
      setText("");
      setPreparedCapture(null);
      setHasTranscript(false);
      setRetryAudio(null);
      setState("saved");
    } catch (captureError) {
      if (!mountedRef.current || controller.signal.aborted) return;
      setError(captureError instanceof Error ? captureError.message : "No se pudo guardar. Intentá de nuevo.");
      setState("idle");
    } finally {
      busyRef.current = false;
    }
  }

  function cancelVoiceEntry() {
    if (busyRef.current) return;
    setText("");
    setPreparedCapture(null);
    setHasTranscript(false);
    setRetryAudio(null);
    setError("");
    setSeconds(0);
    setState("idle");
  }

  async function startRecording() {
    if (busyRef.current) return;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio. Podés escribir tu entrada en Texto.");
      return;
    }
    busyRef.current = true;
    setState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      setSeconds(0);
      setRetryAudio(null);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => {
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        streamRef.current = null;
        setRecordingStream(null);
        busyRef.current = false;
        setState("idle");
        setError("Se interrumpió la grabación. Revisá el micrófono y volvé a grabar.");
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        streamRef.current = null;
        setRecordingStream(null);
        void processAudio(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.start(500);
      setRecordingStream(stream);
      setState("recording");
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      busyRef.current = false;
      if (mountedRef.current) {
        setState("idle");
        setError("No se pudo acceder al micrófono. Revisá el permiso del navegador.");
      }
    }
  }

  const isBusy = ["starting", "recording", "processing", "saving"].includes(state);
  const showEditor = mode === "text" || hasTranscript;

  return (
    <section aria-label="Nueva entrada" className="w-full">
      <div role="group" aria-label="Cómo ingresar tu entrada" className="grid grid-cols-2 gap-1 rounded-2xl border border-[#423c35] bg-[#191815] p-1.5">
        {(["text", "voice"] as const).map((item) => (
          <button key={item} type="button" aria-pressed={mode === item} disabled={isBusy} onClick={() => { setMode(item); setError(""); if (state === "saved") setState("idle"); }} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${mode === item ? "bg-[#ffcb7e] text-[#21180d]" : "text-[#c0b5a7] hover:bg-[#2b2822]"}`}>
            {item === "text" ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 5 5-12 12H4v-5L16 3ZM13 6l5 5" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="8" y="3" width="8" height="13" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></svg>}
            {item === "text" ? "Texto" : "Voz"}
          </button>
        ))}
      </div>

      {mode === "voice" && !hasTranscript ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-6 py-10">
          {state === "recording" && recordingStream ? <RecordingWaveform stream={recordingStream} /> : null}
          <button type="button" disabled={isBusy && state !== "recording"} onClick={() => {
            if (state === "recording" && recorderRef.current?.state === "recording") {
              setState("processing");
              recorderRef.current.stop();
            } else { void startRecording(); }
          }} aria-label={state === "recording" ? "Detener grabación" : "Grabar"} className={`flex h-24 w-24 items-center justify-center !rounded-full border transition focus-visible:outline-offset-8 ${state === "recording" ? "border-[#ff8d81] bg-[#47201f] text-[#ffafa5]" : "border-[#8b693d] bg-[#34281b] text-[#ffd08a] hover:bg-[#493521]"}`}>
            {state === "processing" || state === "starting" ? <span className="h-8 w-8 motion-safe:animate-spin rounded-full border-4 border-[#ffcb7e]/25 border-t-[#ffcb7e]" /> : state === "recording" ? <span className="h-7 w-7 rounded-md bg-current" /> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="8" y="3" width="8" height="13" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></svg>}
          </button>
          <div className="text-center">
            <p role="status" className="text-sm font-semibold text-[#e3d9cd]">{state === "processing" ? "Transcribiendo…" : state === "starting" ? "Abriendo micrófono…" : state === "recording" ? "Detener grabación" : "Grabar"}</p>
            {state === "recording" ? <p className="mt-2 font-mono text-sm tabular-nums text-[#b3a796]">{formatDuration(seconds)}</p> : null}
          </div>
        </div>
      ) : null}

      {showEditor ? (
        <div className="mt-4">
          <label htmlFor="capture-text" className={mode === "voice" ? "mb-3 block text-sm font-semibold text-[#e3d9cd]" : "sr-only"}>{mode === "voice" ? "Tu transcripción · podés editarla" : "Escribí tu entrada"}</label>
          <textarea ref={editorRef} id="capture-text" value={text} disabled={isBusy} maxLength={12_000} onChange={(event) => { setText(event.target.value); setError(""); if (state === "saved") setState("idle"); }} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); void saveEntry(); } }} placeholder="¿Qué querés guardar?" className={styles.paper + " min-h-56 w-full resize-y rounded-lg border border-[#423c35] bg-[#191815] p-5 pl-10 text-base leading-7 text-[#f5eee3] outline-none transition placeholder:text-[#a59a89] focus:border-[#ffcb7e] focus:ring-2 focus:ring-[#ffcb7e]/15 sm:min-h-72"} />
          <div className="mt-4 flex gap-3">
            {mode === "voice" && hasTranscript ? (
              <button type="button" disabled={isBusy} onClick={cancelVoiceEntry} className="min-h-12 rounded-xl border border-[#423c35] px-5 py-3 text-sm font-bold text-[#e3d9cd] transition hover:bg-[#2b2822]">
                Cancelar
              </button>
            ) : null}
            <button type="button" disabled={!text.trim() || isBusy} onClick={() => void saveEntry()} className="flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg bg-[#ffcb7e] px-5 py-3 text-sm font-bold text-[#21180d] transition hover:bg-[#ffd08a] disabled:opacity-45">
              {state === "saving" ? "Guardando…" : "Guardar entrada"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div role="alert" className="mt-4 rounded-xl border border-[#7a3d32] bg-[#2e1716] p-4 text-sm text-[#ffafa5]"><p>{error}</p>{retryAudio && retryAudio.size > 0 && retryAudio.size <= 15 * 1024 * 1024 ? <button type="button" disabled={isBusy} className="mt-3 min-h-11 underline underline-offset-4" onClick={() => { if (!busyRef.current) { busyRef.current = true; void processAudio(retryAudio); } }}>Reintentar transcripción</button> : null}</div> : null}
      {state === "saved" ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p role="status" className={syncPending ? "text-[#ffd08a]" : "text-[#63d3a5]"}>
            {syncPending ? "Entrada en Bandeja · pendiente de sincronizar" : "Entrada sincronizada en Bandeja"}
          </p>
          <div className="flex flex-wrap gap-3">
            {syncPending && syncError ? <button type="button" disabled={isSaving} onClick={retrySync} className="min-h-11 font-semibold text-[#ffd08a] underline underline-offset-4">Reintentar</button> : null}
            <Link href={workspaceHref("inbox")} className="inline-flex min-h-11 items-center font-semibold text-[#ffd08a] underline underline-offset-4">Ver Bandeja</Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

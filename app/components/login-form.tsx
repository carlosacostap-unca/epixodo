"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          typeof payload?.error === "string"
            ? payload.error
            : "No se pudo iniciar sesión. Intentá nuevamente.",
        );
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar. Revisá tu conexión e intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111d] text-[#eaf1fb]">
      <div aria-hidden="true" className="app-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#315e9f]/15 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="hidden max-w-xl lg:block" aria-labelledby="login-story-title">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#82afff] font-mono text-sm font-black text-[#07111d] shadow-[0_12px_32px_rgba(130,175,255,0.24)]">
              E
            </span>
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-[#a9c8fb]">
              Epixodo
            </span>
          </div>

          <h1
            id="login-story-title"
            className="mt-12 max-w-lg text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#f5f8ff]"
          >
            Tu día, en orden.
            <span className="block text-[#82afff]">Tu espacio, bajo llave.</span>
          </h1>
          <p className="mt-6 max-w-md text-base font-medium leading-7 text-[#91a4c0]">
            Entrá a tus tareas, asuntos y fechas clave. Todo queda donde lo dejaste.
          </p>

          <div className="relative mt-12 ml-2 max-w-md border-l border-[#355276] pl-8">
            <span className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-[#82afff] shadow-[0_0_20px_rgba(130,175,255,0.9)]" />
            <span className="absolute -left-[4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#63d3a5]" />
            <span className="absolute -left-[4px] bottom-0 h-2 w-2 rounded-full border border-[#7185a3] bg-[#07111d]" />
            <div className="space-y-9">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#82afff]">
                  Ahora
                </p>
                <p className="mt-1 text-sm font-bold text-[#dce8f8]">Elegí lo que merece atención</p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#63d3a5]">
                  Después
                </p>
                <p className="mt-1 text-sm font-bold text-[#dce8f8]">Avanzá sin perder el contexto</p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7185a3]">
                  Cuando vuelvas
                </p>
                <p className="mt-1 text-sm font-bold text-[#dce8f8]">Retomá exactamente desde ahí</p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="login-title"
          className="mx-auto w-full max-w-md rounded-[28px] border border-[#29415f] bg-[#0b1726]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#82afff] font-mono text-sm font-black text-[#07111d]">
              E
            </span>
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[#a9c8fb]">
              Epixodo
            </span>
          </div>

          <p className="mt-9 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#82afff] lg:mt-0">
            Acceso privado
          </p>
          <h2 id="login-title" className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#f5f8ff]">
            Volvé a tu espacio
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#8fa2be]">
            Usá el email y la contraseña de tu cuenta.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="text-xs font-black text-[#c8d5e8]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                autoFocus
                disabled={isSubmitting}
                placeholder="vos@ejemplo.com"
                className="mt-2 h-12 w-full rounded-xl border border-[#304968] bg-[#0d1c2e] px-4 text-sm font-semibold text-[#f3f7fd] outline-none transition placeholder:text-[#5f7594] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-black text-[#c8d5e8]">
                Contraseña
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-[#304968] bg-[#0d1c2e] px-4 pr-20 text-sm font-semibold text-[#f3f7fd] outline-none transition focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#91a4c0] transition hover:bg-[#172b44] hover:text-[#dfeaff]"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-[#76463f] bg-[#2b1818] px-3.5 py-3 text-sm font-semibold leading-5 text-[#ffab9a]"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#82afff] px-4 text-sm font-black text-[#07111d] shadow-[0_12px_32px_rgba(130,175,255,0.18)] transition hover:bg-[#9bc0ff] active:translate-y-px"
            >
              <LockIcon />
              {isSubmitting ? "Comprobando acceso…" : "Entrar a mi espacio"}
            </button>
          </form>

          <p className="mt-6 border-t border-[#233a57] pt-5 text-center text-xs font-medium leading-5 text-[#7185a3]">
            Las cuentas se administran desde PocketBase.
          </p>
        </section>
      </div>
    </main>
  );
}

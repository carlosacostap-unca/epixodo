import Link from "next/link";
import { modules, workspaceHref } from "../lib/module-navigation";
import ViewIcon from "./view-icon";

export default function ModuleLauncher() {
  return (
    <main className="flex-1 bg-[#101e23] px-4 py-8 text-[#eaf4ec] sm:px-7 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-serif text-5xl tracking-[-0.06em] sm:mb-9 sm:text-7xl">Inicio</h1>
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(15rem,0.85fr)_minmax(0,2fr)]">
          <Link
            href={workspaceHref("today")}
            prefetch={false}
            className="group relative isolate flex min-h-40 flex-col justify-between overflow-hidden rounded-sm bg-[#bcefd9] p-5 text-[#17372f] outline-offset-4 sm:p-7 lg:min-h-72"
          >
            <span aria-hidden="true" className="absolute -right-16 -top-16 -z-10 size-64 rounded-full border border-[#77ac9a] shadow-[0_0_0_28px_#afe4cd,0_0_0_29px_#8abcaa,0_0_0_56px_#b6e9d2,0_0_0_57px_#9bc9b8]" />
            <ViewIcon view="today" className="size-7" />
            <span className="grid gap-2">
              <span className="flex items-baseline justify-between gap-2 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
                Ver mi día <span aria-hidden="true" className="font-sans text-2xl motion-safe:transition-transform motion-safe:group-hover:translate-x-1">→</span>
              </span>
              <span className="max-w-60 text-sm font-medium">Lo que requiere tu atención hoy.</span>
            </span>
          </Link>
          <nav aria-label="Módulos de Epixodo">
            <ul className="grid h-full gap-px overflow-hidden rounded-sm border border-[#39555a] bg-[#39555a] sm:grid-cols-2">
              {modules.map(({ id, label, description, views }) => (
                <li key={id} className="last:sm:col-span-2">
                  <Link
                    href={`/${id}`}
                    prefetch={false}
                    className="group grid h-full min-h-24 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 bg-[#182b31] px-4 py-4 outline-offset-[-3px] hover:bg-[#223e42] sm:px-5"
                  >
                    <ViewIcon view={views[0]} className="mt-0.5 size-5 text-[#bcefd9]" />
                    <span className="grid gap-1">
                      <span className="text-base font-bold tracking-tight">{label}</span>
                      <span className="text-sm leading-snug text-[#b3c9c6]">{description}</span>
                    </span>
                    <span aria-hidden="true" className="text-[#bcefd9] motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}

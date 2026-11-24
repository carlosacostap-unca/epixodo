import Link from "next/link";
import { modules, workspaceHref } from "../lib/module-navigation";
import ViewIcon from "./view-icon";
import styles from "./daily-workspace.module.css";
import ui from "./workspace-screen.module.css";

export default function ModuleLauncher() {
  return (
    <main className={`${ui.screen} ${styles.screen}`}>
      <div className={ui.frame}>
        <header className={`${ui.header} pb-4`}>
          <div className={ui.heading}><h1 className={ui.title}>Inicio</h1></div>
        </header>
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(15rem,0.85fr)_minmax(0,2fr)]">
          <Link
            href={workspaceHref("today")}
            prefetch={false}
            className={`${ui.panel} ${styles.dayLink} group flex flex-col items-start justify-center gap-4 p-5 sm:p-6 lg:gap-5`}
          >
            <span className="grid size-11 place-items-center rounded-lg bg-(--accent) text-(--workspace-canvas)">
              <ViewIcon view="today" className="size-6" />
            </span>
            <span className="grid w-full gap-1">
              <span className="flex items-baseline justify-between gap-2 text-2xl font-semibold tracking-tight">
                Ver mi día <span aria-hidden="true" className="text-(--accent) motion-safe:transition-transform motion-safe:group-hover:translate-x-1">→</span>
              </span>
              <span className="text-sm leading-snug text-(--workspace-muted)">Lo que requiere tu atención hoy.</span>
            </span>
          </Link>
          <nav aria-label="Módulos de Epixodo" className={`${ui.panel} overflow-hidden`}>
            <ul className="grid h-full gap-px bg-(--workspace-border) sm:grid-cols-2">
              {modules.map(({ id, label, description, views }) => (
                <li key={id} className="last:sm:col-span-2">
                  <Link
                    href={`/${id}`}
                    prefetch={false}
                    className="group grid h-full min-h-22 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 bg-(--workspace-surface) p-4 outline-offset-[-3px] hover:bg-(--workspace-hover) sm:px-5"
                  >
                    <ViewIcon view={views[0]} className="mt-0.5 size-5 text-(--accent)" />
                    <span className="grid gap-1">
                      <span className={ui.panelTitle}>{label}</span>
                      <span className="text-sm leading-snug text-(--workspace-muted)">{description}</span>
                    </span>
                    <span aria-hidden="true" className="text-(--accent) motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5">↗</span>
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

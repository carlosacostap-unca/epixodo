"use client";

import Link from "next/link";
import ViewIcon from "../../components/view-icon";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";
import { workspaceHref } from "../../lib/module-navigation";
import CaptureComposer from "./composer";
import CaptureInbox from "./inbox";
import styles from "./capture.module.css";

export default function CaptureScreen({ reviewing, entryId }: { reviewing: boolean; entryId?: string }) {
  const workspace = useWorkspace();
  if (!workspace.isLoaded) return <WorkspaceLoading />;

  const active = reviewing ? "inbox" : "capture";
  const count = workspace.capture.entries.length;

  return (
    <main className={`${styles.screen} flex-1 px-4 pb-12 pt-7 sm:px-8 sm:pt-12`}>
      <div className={`mx-auto ${reviewing ? "max-w-7xl" : "max-w-3xl"}`}>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-5 border-b border-[#423c35] pb-5 sm:mb-8">
          <h1 className="font-serif text-5xl leading-none tracking-[-0.055em] sm:text-7xl">{reviewing ? "Bandeja" : "Captura"}</h1>
          <nav aria-label="Vistas de Captura" className="flex flex-wrap gap-1 rounded-lg border border-[#423c35] bg-[#191815] p-1">
            {(["capture", "inbox"] as const).map((view) => (
              <Link
                key={view}
                href={workspaceHref(view)}
                aria-current={active === view ? "page" : undefined}
                className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#c0b5a7] hover:bg-[#2b2822] aria-[current=page]:bg-[#352b20] aria-[current=page]:text-[#ffd08a]"
              >
                <ViewIcon view={view} />
                {view === "capture" ? "Nueva entrada" : "Bandeja"}
                {view === "inbox" && count > 0 ? <span className="font-mono text-xs tabular-nums">{count}</span> : null}
              </Link>
            ))}
          </nav>
        </header>
        {reviewing ? <CaptureInbox entryId={entryId} /> : <CaptureComposer onCapture={workspace.capture.addEntry} />}
      </div>
    </main>
  );
}

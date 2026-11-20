"use client";

import Link from "next/link";
import ViewIcon from "../../components/view-icon";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";
import ui from "../../components/workspace-screen.module.css";
import { workspaceHref } from "../../lib/module-navigation";
import CaptureComposer from "./composer";
import CaptureInbox from "./inbox";
import styles from "./capture.module.css";

export default function CaptureScreen({ reviewing, entryId }: { reviewing: boolean; entryId?: string }) {
  const workspace = useWorkspace();
  if (!workspace.isLoaded) return <WorkspaceLoading />;

  const active = reviewing ? "inbox" : "capture";
  const count = workspace.capture.entries.length;
  const title = reviewing ? "Bandeja" : "Captura";
  const showEntry = reviewing && workspace.capture.entries.some((entry) => entry.id === entryId);

  return (
    <main className={`${ui.screen} ${styles.capture}`}>
      <div className={ui.frame}>
        {showEntry ? <h1 className="sr-only lg:hidden">{title}</h1> : null}
        <header className={`${ui.header} ${showEntry ? "hidden lg:block" : ""}`}>
          <div className={ui.heading}><h1 className={ui.title}>{title}</h1></div>
          <nav aria-label="Vistas de Captura" className={ui.tabs}>
            {(["capture", "inbox"] as const).map((view) => (
              <Link
                key={view}
                href={workspaceHref(view)}
                aria-current={active === view ? "page" : undefined}
                className={ui.tab}
              >
                <ViewIcon view={view} />
                {view === "capture" ? "Nueva entrada" : "Bandeja"}
                {view === "inbox" && count > 0 ? <span className="font-mono text-xs tabular-nums">{count}</span> : null}
              </Link>
            ))}
          </nav>
        </header>
        {reviewing ? <CaptureInbox entryId={entryId} /> : (
          <div className="max-w-3xl"><CaptureComposer onCapture={workspace.capture.addEntry} /></div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { inboxHref } from "../../lib/module-navigation";
import FinanceView from "./view";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";
import ui from "../../components/workspace-screen.module.css";
import styles from "./finance.module.css";

export default function FinanceScreen({ returnEntryId }: { returnEntryId?: string }) {
  const workspace = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  if (!workspace.isLoaded) return <WorkspaceLoading />;

  return (
    <main className={`${ui.screen} ${styles.finance}`}>
      <div className={ui.frame}>
        {returnEntryId ? <Link href={inboxHref(returnEntryId)} className={`${ui.backLink} mb-2 inline-flex`}><span aria-hidden="true">←</span> Volver a la entrada</Link> : null}
        <header className={ui.header}>
          <div className={ui.heading}>
            <h1 className={ui.title}>Finanzas</h1>
            <label className={`${ui.label} w-full sm:max-w-72`}>
              Buscar movimientos y pagos
              <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className={`${ui.control} px-3`} />
            </label>
          </div>
          <nav aria-label="Secciones de Finanzas" className={ui.tabs}>
            <a href="#finance-due-payments-title" className={ui.tab}>Vencimientos <span aria-hidden="true">↓</span></a>
            {workspace.finance.accounts.length ? <a href="#finance-entries-title" className={ui.tab}>Movimientos <span aria-hidden="true">↓</span></a> : null}
          </nav>
        </header>
        <FinanceView finance={workspace.finance} searchQuery={searchQuery} />
      </div>
    </main>
  );
}

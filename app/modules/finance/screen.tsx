"use client";

import { useState } from "react";
import Link from "next/link";
import { inboxHref } from "../../lib/module-navigation";
import FinanceView from "./view";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";

export default function FinanceScreen({ returnEntryId }: { returnEntryId?: string }) {
  const workspace = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  if (!workspace.isLoaded) return <WorkspaceLoading />;

  return (
    <main className="flex-1 bg-[#151422] px-4 py-8 text-[#f0ebfc] sm:px-7 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {returnEntryId ? <Link href={inboxHref(returnEntryId)} className="inline-flex min-h-11 items-center font-semibold text-[#d8bdf9] underline underline-offset-4">← Volver a la entrada</Link> : null}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#443a58] pb-5">
          <h1 className="font-serif text-5xl tracking-[-0.065em] sm:text-7xl">Finanzas</h1>
          <label className="grid w-full gap-1.5 text-sm font-medium text-[#c6bad9] sm:max-w-72">
            Buscar movimientos y pagos
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-h-11 border border-[#574968] bg-[#231d31] px-3 text-base text-[#f0ebfc]" />
          </label>
        </header>
        <nav aria-label="Secciones de Finanzas" className="flex flex-wrap gap-2">
          <a href="#finance-due-payments-title" className="inline-flex min-h-11 items-center rounded-md border border-[#574968] px-3 text-sm font-semibold text-[#e1d1fa]">Vencimientos ↓</a>
          {workspace.finance.accounts.length ? <a href="#finance-entries-title" className="inline-flex min-h-11 items-center rounded-md border border-[#574968] px-3 text-sm font-semibold text-[#e1d1fa]">Movimientos ↓</a> : null}
        </nav>
        <FinanceView finance={workspace.finance} searchQuery={searchQuery} />
      </div>
    </main>
  );
}

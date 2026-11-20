"use client";

import { useState } from "react";
import FinanceView from "./view";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";

export default function FinanceScreen() {
  const workspace = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  if (!workspace.isLoaded) return <WorkspaceLoading />;

  return (
    <main className="flex-1 bg-[#151422] px-4 py-8 text-[#f0ebfc] sm:px-7 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#443a58] pb-5">
          <h1 className="font-serif text-5xl tracking-[-0.065em] sm:text-7xl">Finanzas</h1>
          <label className="grid w-full gap-1.5 text-sm font-medium text-[#c6bad9] sm:max-w-72">
            Buscar movimientos y pagos
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-h-11 border border-[#574968] bg-[#231d31] px-3 text-base text-[#f0ebfc]" />
          </label>
        </header>
        <FinanceView finance={workspace.finance} searchQuery={searchQuery} />
      </div>
    </main>
  );
}

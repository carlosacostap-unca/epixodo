"use client";

import { useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { destinations } from "../lib/module-navigation";
import LogoutButton from "./logout-button";

export default function WorkspaceNavigation() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const active = destinations.find(({ id }) => pathname === `/${id}`);

  return (
    <header className="sticky top-0 z-40 border-b border-[#294348] bg-[#101e23] text-[#e4f3ed]">
      <nav aria-label="Navegación de Epixodo" className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7">
        <Link href="/" aria-label="Epixodo, Inicio" aria-current={pathname === "/" ? "page" : undefined} className="inline-flex min-h-11 items-center gap-2.5 rounded-sm text-base font-bold tracking-tight">
          <span aria-hidden="true" className="grid size-7 place-items-center rounded bg-[#bcefd9] font-mono text-sm text-[#102721]">E</span>
          Epixodo
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dialog.current?.showModal()}
            aria-haspopup="dialog"
            className="inline-flex min-h-11 items-center gap-2 border border-[#3c565b] px-3 text-sm font-semibold hover:bg-[#22353b]"
          >
            Módulos <span aria-hidden="true" className="text-[#bcefd9]">▾</span>
          </button>
          <div className="hidden sm:block"><LogoutButton /></div>
        </div>
      </nav>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="module-switcher m-auto w-[calc(100%-2rem)] max-w-sm max-h-[min(38rem,calc(100dvh-2rem))] overflow-y-auto rounded-xl border border-[#50706e] bg-[#13252a] p-4 text-[#e4f3ed] shadow-2xl backdrop:bg-[#060e12]/75"
      >
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-[#365258] pb-2">
          <h2 id={titleId} className="pl-2 text-lg font-bold">Módulos</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar selector de módulos" className="grid size-11 place-items-center text-xl hover:bg-[#22383d]">×</button>
        </div>
        <nav aria-label="Destinos">
          <ul className="grid gap-0.5">
            {[{ id: "", label: "Inicio" }, ...destinations].map(({ id, label }) => (
              <li key={id}>
                <Link
                  href={`/${id}`}
                  prefetch={false}
                  aria-current={(active?.id ?? "") === id ? "page" : undefined}
                  onClick={() => dialog.current?.close()}
                  className="flex min-h-11 items-center justify-between rounded px-3 text-sm font-semibold hover:bg-[#22383d] aria-[current=page]:bg-[#294641] aria-[current=page]:text-[#c4f6e0]"
                >
                  {label}<span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-3 border-t border-[#365258] pt-3 sm:hidden"><LogoutButton /></div>
      </dialog>
    </header>
  );
}

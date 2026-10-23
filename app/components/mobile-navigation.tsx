"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import LogoutButton from "./logout-button";

export default function MobileNavigation({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const titleId = useId();
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) dialogRef.current?.close(); };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, []);

  return (
    <div className="lg:hidden">
      <button type="button" aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={dialogId} onClick={() => { dialogRef.current?.showModal(); setIsOpen(true); }} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#293f5e] text-[#c8d5e8] hover:bg-[#192d46]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <dialog ref={dialogRef} id={dialogId} aria-labelledby={titleId} onClose={() => setIsOpen(false)} className="mobile-navigation fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-[calc(100%_-_24px)] max-w-[340px] border-l border-[#293f5e] bg-[#0b1624] p-0 text-[#eaf1fb] shadow-2xl backdrop:bg-black/65" onClick={(event) => {
        if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) close();
      }}>
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-[#20334d] px-5 py-4">
            <h2 id={titleId} className="text-base font-bold">Mi espacio</h2>
            <button type="button" aria-label="Cerrar menú" onClick={close} className="flex h-11 w-11 items-center justify-center text-[#9fb0c9] hover:bg-[#192d46]"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
          </div>
          <nav aria-label="Secciones" onClick={(event) => { if ((event.target as HTMLElement).closest("button")) close(); }} className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto overscroll-contain p-4">{children}</nav>
          <div className="shrink-0 border-t border-[#20334d] p-5 pb-[max(20px,env(safe-area-inset-bottom))]"><LogoutButton /></div>
        </div>
      </dialog>
    </div>
  );
}

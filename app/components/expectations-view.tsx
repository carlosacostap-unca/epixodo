"use client";

import { type FormEvent, useMemo, useState } from "react";
import type { TaskWorkspace } from "../hooks/use-task-workspace";
import { compareDateOnly } from "../lib/tasks";

const fieldClass = "h-11 w-full rounded-xl border border-[#3b4f71] bg-[#091727] px-3 text-sm font-semibold text-[#edf3ff] outline-none transition placeholder:text-[#61728c] focus:border-[#a7a8ff] focus:ring-2 focus:ring-[#a7a8ff]/15";
const labelClass = "grid gap-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#8392ae]";

export default function ExpectationsView({ workspace }: { workspace: TaskWorkspace }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"pending" | "resolved">("pending");
  const visible = useMemo(() => workspace.orderedExpectations.filter((item) =>
    filter === "pending" ? item.status === "pending" : item.status !== "pending"), [filter, workspace.orderedExpectations]);
  const dueToday = workspace.expectations.filter((item) => item.status === "pending" && item.expectedDate === workspace.today).length;
  const overdue = workspace.expectations.filter((item) => item.status === "pending" && compareDateOnly(item.expectedDate, workspace.today) < 0).length;

  return <div className="grid gap-5">
    <section className="relative overflow-hidden rounded-3xl border border-[#414b7c] bg-[linear-gradient(120deg,#111c39,#171b33_55%,#231d3d)] p-5 shadow-[0_22px_70px_rgba(4,8,24,0.28)] sm:p-6">
      <div aria-hidden="true" className="absolute -right-14 -top-20 h-52 w-52 rounded-full border border-[#a7a8ff]/15 shadow-[0_0_0_28px_rgba(167,168,255,0.035),0_0_0_58px_rgba(167,168,255,0.02)]" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#a7a8ff]">Radar de llegadas</p><h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#f4f4ff]">Lo que debería ocurrir</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#9da9c5]">Entregas, respuestas y novedades que dependen de otros. En la fecha esperada decidís si ocurrieron o no.</p></div>
        <button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-[#a7a8ff] px-4 py-3 text-sm font-black text-[#101229] shadow-[0_10px_26px_rgba(167,168,255,0.2)] transition hover:-translate-y-0.5 hover:bg-[#c3c4ff]">{showForm ? "Cerrar" : "+ Nueva espera"}</button>
      </div>
      <div className="relative mt-5 flex flex-wrap gap-2"><Stat value={workspace.expectations.filter((item) => item.status === "pending").length} label="pendientes" /><Stat value={dueToday} label="para hoy" tone="today" /><Stat value={overdue} label="sin confirmar" tone="late" /></div>
    </section>

    {showForm ? <ExpectationForm today={workspace.today} onSave={(draft) => { workspace.addExpectation(draft); setShowForm(false); }} /> : null}

    <div className="flex gap-2 rounded-xl border border-[#293b57] bg-[#0d1a2a] p-1.5">
      <FilterButton active={filter === "pending"} onClick={() => setFilter("pending")}>Pendientes</FilterButton>
      <FilterButton active={filter === "resolved"} onClick={() => setFilter("resolved")}>Historial</FilterButton>
    </div>

    {visible.length ? <div className="grid gap-3">{visible.map((item) => {
      const timing = item.status === "pending" ? compareDateOnly(item.expectedDate, workspace.today) : 1;
      return <article key={item.id} className="grid gap-4 rounded-2xl border border-[#313f61] bg-[#111f34] p-4 shadow-[0_10px_32px_rgba(0,0,0,0.14)] md:grid-cols-[116px_minmax(0,1fr)_auto] md:items-center">
        <div className={`rounded-xl border px-3 py-3 text-center ${timing < 0 ? "border-[#76505b] bg-[#2b1720]" : timing === 0 ? "border-[#72643d] bg-[#292316]" : "border-[#464f83] bg-[#171c3a]"}`}><p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#8996b5]">{timing < 0 ? "Pendiente" : timing === 0 ? "Hoy" : "Esperado"}</p><p className="mt-1 font-mono text-lg font-black text-[#eef0ff]">{formatDate(item.expectedDate)}</p></div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#f1f3ff]">{item.title}</h3>{item.quantity ? <span className="rounded-full border border-[#46547a] px-2 py-0.5 font-mono text-[10px] font-black text-[#abb9d6]">× {item.quantity}</span> : null}{item.source ? <span className="text-xs font-bold text-[#a7a8ff]">{item.source}</span> : null}</div>{item.notes ? <p className="mt-2 text-sm leading-6 text-[#8f9db9]">{item.notes}</p> : null}{item.status !== "pending" ? <p className={`mt-2 text-xs font-black ${item.status === "occurred" ? "text-[#6dd7ae]" : "text-[#f09a94]"}`}>{item.status === "occurred" ? "Ocurrió" : "No ocurrió"}</p> : null}</div>
        <div className="flex flex-wrap gap-2 md:justify-end">{item.status === "pending" ? <><ActionButton tone="yes" onClick={() => workspace.updateExpectationStatus(item.id, "occurred")}>Ocurrió</ActionButton><ActionButton tone="no" onClick={() => workspace.updateExpectationStatus(item.id, "not_occurred")}>No ocurrió</ActionButton></> : <><ActionButton onClick={() => workspace.updateExpectationStatus(item.id, "pending")}>Volver a pendiente</ActionButton><button type="button" onClick={() => window.confirm("¿Eliminar esta espera?") && workspace.deleteExpectation(item.id)} className="px-2 py-2 text-xs font-bold text-[#d98787]">Eliminar</button></>}</div>
      </article>;
    })}</div> : <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-[#344260] bg-[#0c1828] p-8 text-center"><div><span className="font-mono text-3xl text-[#a7a8ff]">◌</span><h3 className="mt-3 font-black text-[#eef0ff]">{filter === "pending" ? "Nada pendiente de llegar" : "Todavía no resolviste esperas"}</h3><p className="mt-2 text-sm text-[#7786a2]">Las novedades que dependan de otros van a aparecer acá.</p></div></div>}
  </div>;
}

function ExpectationForm({ today, onSave }: { today: string; onSave: TaskWorkspace["addExpectation"] }) {
  const [title, setTitle] = useState(""); const [expectedDate, setExpectedDate] = useState(today); const [quantity, setQuantity] = useState(""); const [source, setSource] = useState(""); const [notes, setNotes] = useState(""); const [error, setError] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); const parsedQuantity = quantity ? Number(quantity) : null; if (!title.trim() || !expectedDate || !(parsedQuantity === null || (Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0))) return setError("Completá qué esperás, la fecha y una cantidad válida."); onSave({ title, expectedDate, quantity: parsedQuantity, source, notes }); }
  return <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-[#3e4776] bg-[#111d35] p-4 md:grid-cols-2 xl:grid-cols-4"><label className={`${labelClass} md:col-span-2`}>Qué esperás<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dos compras de Mercado Libre" className={fieldClass} autoFocus /></label><label className={labelClass}>Fecha esperada<input type="date" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} className={fieldClass} /></label><label className={labelClass}>Cantidad<input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="2" className={fieldClass} /></label><label className={labelClass}>Origen<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Mercado Libre" className={fieldClass} /></label><label className={`${labelClass} md:col-span-2`}>Notas<input value={notes} onChange={(event) => setNotes(event.target.value)} className={fieldClass} /></label><button className="self-end rounded-xl bg-[#a7a8ff] px-4 py-3 text-sm font-black text-[#101229]">Guardar espera</button>{error ? <p role="alert" className="text-sm font-bold text-[#f09a94] md:col-span-full">{error}</p> : null}</form>;
}

function Stat({ value, label, tone = "normal" }: { value: number; label: string; tone?: "normal" | "today" | "late" }) { return <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${tone === "late" && value ? "border-[#76505b] bg-[#2b1720] text-[#f09a94]" : tone === "today" && value ? "border-[#72643d] bg-[#292316] text-[#f2c76f]" : "border-[#414b73] bg-[#151d36] text-[#aeb9d5]"}`}><strong className="font-mono text-sm text-[#f0f1ff]">{value}</strong> {label}</span>; }
function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`flex-1 rounded-lg px-4 py-2 text-sm font-black transition ${active ? "bg-[#263158] text-[#dfe1ff]" : "text-[#7e8ba6] hover:text-[#c5cbea]"}`}>{children}</button>; }
function ActionButton({ onClick, children, tone = "neutral" }: { onClick: () => void; children: React.ReactNode; tone?: "neutral" | "yes" | "no" }) { return <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-2 text-xs font-black transition ${tone === "yes" ? "border-[#356954] text-[#6dd7ae] hover:bg-[#153328]" : tone === "no" ? "border-[#70454e] text-[#f09a94] hover:bg-[#301a21]" : "border-[#46547a] text-[#b7c3dd] hover:bg-[#1b2943]"}`}>{children}</button>; }
function formatDate(value: string) { return value.split("-").reverse().slice(0, 2).join("/"); }

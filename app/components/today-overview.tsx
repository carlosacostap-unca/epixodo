"use client";

import type { ReactNode } from "react";
import type { TaskWorkspace } from "../hooks/use-task-workspace";
import { formatMoney } from "../lib/finance";
import { getMealTypeLabel, getPlanItemLabel } from "../lib/nutrition";
import { compareDateOnly, getSubjectPath } from "../lib/tasks";

type TodayModule = "calendar" | "finances" | "nutrition" | "locations" | "expectations";

function matchesQuery(query: string, ...values: Array<string | null | undefined>) {
  const normalized = query.trim().toLocaleLowerCase("es");
  return !normalized || values.join(" ").toLocaleLowerCase("es").includes(normalized);
}

function SectionHeader({
  eyebrow,
  title,
  count,
  tone,
  onOpen,
}: {
  eyebrow: string;
  title: string;
  count: number;
  tone: string;
  onOpen?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#263a55] px-4 py-3 sm:px-5">
      <div>
        <p className={`font-mono text-[10px] font-black uppercase tracking-[0.17em] ${tone}`}>{eyebrow}</p>
        <h3 className="mt-1 text-lg font-black text-[#eef4ff]">{title}</h3>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-[#334b6c] bg-[#0b1726] px-2.5 py-1 font-mono text-xs font-black text-[#c8d6ea]">{count}</span>
        {onOpen ? <button type="button" onClick={onOpen} className="text-xs font-black text-[#9dbcf0] transition hover:text-[#d9e7ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#82afff]/40">Abrir sección →</button> : null}
      </div>
    </div>
  );
}

function EmptySection({ children }: { children: ReactNode }) {
  return <p className="px-5 py-6 text-sm text-[#7385a0]">{children}</p>;
}

function AgendaCard({ children }: { children: ReactNode }) {
  return <article className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">{children}</article>;
}

export function getTodayOverviewCount(workspace: TaskWorkspace) {
  const consumedPlanIds = new Set(
    workspace.nutritionIntakeEntries
      .filter((entry) => entry.date === workspace.today && entry.planItemId)
      .map((entry) => entry.planItemId),
  );

  return (
    workspace.views.today.length +
    workspace.subjectEvents.filter((event) => event.date === workspace.today).length +
    workspace.financeDuePayments.filter((payment) => payment.status === "pending" && compareDateOnly(payment.dueDate, workspace.today) <= 0).length +
    workspace.expectations.filter((item) => item.status === "pending" && compareDateOnly(item.expectedDate, workspace.today) <= 0).length +
    workspace.nutritionPlanItems.filter((item) => item.date === workspace.today && !consumedPlanIds.has(item.id)).length +
    workspace.locationEntries.filter((entry) => entry.date === workspace.today).length
  );
}

export default function TodayOverview({
  workspace,
  searchQuery,
  taskCount,
  taskContent,
  onNavigate,
  onOpenSubject,
}: {
  workspace: TaskWorkspace;
  searchQuery: string;
  taskCount: number;
  taskContent: ReactNode;
  onNavigate: (module: TodayModule) => void;
  onOpenSubject: (subjectId: string) => void;
}) {
  const consumedPlanIds = new Set(
    workspace.nutritionIntakeEntries
      .filter((entry) => entry.date === workspace.today && entry.planItemId)
      .map((entry) => entry.planItemId),
  );
  const events = workspace.subjectEvents.filter((event) =>
    event.date === workspace.today && matchesQuery(searchQuery, event.description, getSubjectPath(workspace.subjects, event.subjectId)),
  );
  const payments = workspace.financeDuePayments.filter((payment) => {
    const account = workspace.financeAccounts.find((item) => item.id === payment.accountId);
    return payment.status === "pending" && compareDateOnly(payment.dueDate, workspace.today) <= 0 && matchesQuery(searchQuery, payment.description, payment.category, account?.name);
  });
  const expectations = workspace.expectations.filter((item) =>
    item.status === "pending" && compareDateOnly(item.expectedDate, workspace.today) <= 0 && matchesQuery(searchQuery, item.title, item.notes, item.source),
  );
  const meals = workspace.nutritionPlanItems.filter((item) => {
    const label = getPlanItemLabel(item, workspace.nutritionFoods, workspace.nutritionRecipes);
    return item.date === workspace.today && !consumedPlanIds.has(item.id) && matchesQuery(searchQuery, label, getMealTypeLabel(item.mealType));
  });
  const locations = workspace.locationEntries
    .filter((entry) => entry.date === workspace.today && matchesQuery(searchQuery, entry.plannedLocation, entry.actualLocation, entry.notes))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const visibleCount = taskCount + events.length + payments.length + expectations.length + meals.length + locations.length;
  const summary = [
    { label: "Tareas", value: taskCount, color: "bg-[#82afff]" },
    { label: "Fechas clave", value: events.length, color: "bg-[#f6c177]" },
    { label: "Pagos", value: payments.length, color: "bg-[#ff9d88]" },
    { label: "Esperas", value: expectations.length, color: "bg-[#a7a8ff]" },
    { label: "Comidas", value: meals.length, color: "bg-[#91c9a8]" },
    { label: "Lugares", value: locations.length, color: "bg-[#8fc8e4]" },
  ];

  if (visibleCount === 0) {
    return <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-[#314966] bg-[#0b1726] p-8 text-center"><div><span className="font-mono text-3xl text-[#63d3a5]">✓</span><h3 className="mt-3 text-lg font-black text-[#eef4ff]">{searchQuery.trim() ? "Nada coincide en la agenda" : "Tu día está despejado"}</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#7f91aa]">{searchQuery.trim() ? "Probá con otro término o limpiá la búsqueda." : "No hay acciones pendientes registradas para hoy en ninguna sección."}</p></div></div>;
  }

  return (
    <div className="space-y-5">
      <section aria-label="Resumen del día" className="overflow-hidden rounded-2xl border border-[#315177] bg-[linear-gradient(110deg,#10243b,#0d1a2a_62%,#112a30)] shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
        <div className="grid divide-y divide-[#29415e] sm:grid-cols-3 sm:divide-x sm:divide-y-0 xl:grid-cols-6">
          {summary.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-3 sm:block"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${item.color}`} /><span className="text-xs font-bold text-[#91a3bc]">{item.label}</span></div><strong className="font-mono text-xl text-[#f1f6ff] sm:mt-2 sm:block">{item.value}</strong></div>)}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#293b57] bg-[#111f34]">
        <SectionHeader eyebrow="Acción directa" title="Tareas" count={taskCount} tone="text-[#82afff]" />
        <div className="space-y-3 p-3 sm:p-4">{taskContent}</div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-[#4e4933] bg-[#171a22]">
          <SectionHeader eyebrow="Asuntos" title="Hitos y vencimientos" count={events.length} tone="text-[#f6c177]" onOpen={() => onNavigate("calendar")} />
          {events.length ? <div className="divide-y divide-[#353a43]">{events.map((event) => <AgendaCard key={event.id}><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#caa35d]">{event.kind === "deadline" ? "Vencimiento" : "Hito"}</p><button type="button" onClick={() => onOpenSubject(event.subjectId)} className="mt-1 text-left font-black text-[#f4f0e7] hover:text-[#f6c177]">{event.description}</button><p className="mt-1 text-xs text-[#918b7b]">{getSubjectPath(workspace.subjects, event.subjectId)}</p></div></AgendaCard>)}</div> : <EmptySection>No hay hitos ni vencimientos hoy.</EmptySection>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#5b3d3b] bg-[#1d171b]">
          <SectionHeader eyebrow="Finanzas" title="Pagos que requieren atención" count={payments.length} tone="text-[#ff9d88]" onOpen={() => onNavigate("finances")} />
          {payments.length ? <div className="divide-y divide-[#432d30]">{payments.map((payment) => { const account = workspace.financeAccounts.find((item) => item.id === payment.accountId); const overdue = compareDateOnly(payment.dueDate, workspace.today) < 0; return <AgendaCard key={payment.id}><div><div className="flex flex-wrap items-center gap-2"><p className="font-black text-[#fff0ed]">{payment.description}</p>{overdue ? <span className="rounded-full bg-[#4a2323] px-2 py-0.5 text-[10px] font-black uppercase text-[#ff9d88]">Vencido</span> : null}</div><p className="mt-1 text-xs text-[#a98b8b]">{account?.name ?? "Cuenta"} · {formatMoney(payment.amountMinor, account?.currency ?? "ARS")}</p></div><button type="button" onClick={() => workspace.setFinanceDuePaymentState(payment.id, "paid")} className="rounded-lg border border-[#724b48] px-3 py-2 text-xs font-black text-[#ffb0a0] hover:bg-[#321e20]">Marcar pagado</button></AgendaCard>; })}</div> : <EmptySection>No hay pagos pendientes para hoy.</EmptySection>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#464878] bg-[#161a32]">
          <SectionHeader eyebrow="Esperas" title="Confirmaciones pendientes" count={expectations.length} tone="text-[#a7a8ff]" onOpen={() => onNavigate("expectations")} />
          {expectations.length ? <div className="divide-y divide-[#34375d]">{expectations.map((item) => <AgendaCard key={item.id}><div><div className="flex flex-wrap items-center gap-2"><p className="font-black text-[#f3f3ff]">{item.title}</p>{compareDateOnly(item.expectedDate, workspace.today) < 0 ? <span className="rounded-full bg-[#34203a] px-2 py-0.5 text-[10px] font-black uppercase text-[#d1a6ff]">Sin confirmar</span> : null}</div><p className="mt-1 text-xs text-[#979ac0]">{item.source || "Esperado hoy"}{item.quantity ? ` · × ${item.quantity}` : ""}</p></div><div className="flex gap-2"><button type="button" onClick={() => workspace.updateExpectationStatus(item.id, "occurred")} className="rounded-lg border border-[#376653] px-3 py-2 text-xs font-black text-[#6dd7ae]">Ocurrió</button><button type="button" onClick={() => workspace.updateExpectationStatus(item.id, "not_occurred")} className="rounded-lg border border-[#70454e] px-3 py-2 text-xs font-black text-[#f09a94]">No ocurrió</button></div></AgendaCard>)}</div> : <EmptySection>No hay confirmaciones pendientes para hoy.</EmptySection>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#365247] bg-[#0d1d17]">
          <SectionHeader eyebrow="Nutrición" title="Comidas por registrar" count={meals.length} tone="text-[#91c9a8]" onOpen={() => onNavigate("nutrition")} />
          {meals.length ? <div className="divide-y divide-[#29443a]">{meals.map((item) => <AgendaCard key={item.id}><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#e7a977]">{getMealTypeLabel(item.mealType)}</p><p className="mt-1 font-black text-[#eef6f1]">{getPlanItemLabel(item, workspace.nutritionFoods, workspace.nutritionRecipes)}</p></div><button type="button" onClick={() => workspace.consumeNutritionPlanItem(item.id)} className="rounded-lg border border-[#4b735f] px-3 py-2 text-xs font-black text-[#91c9a8]">Registrar</button></AgendaCard>)}</div> : <EmptySection>No quedan comidas planificadas por registrar.</EmptySection>}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#315369] bg-[#0a1820]">
        <SectionHeader eyebrow="Ubicaciones" title="Dónde tenés que estar" count={locations.length} tone="text-[#8fc8e4]" onOpen={() => onNavigate("locations")} />
        {locations.length ? <div className="grid divide-y divide-[#294552] md:grid-cols-2 md:divide-x md:divide-y-0">{locations.map((entry) => <AgendaCard key={entry.id}><div><p className="font-mono text-xs font-black text-[#8fc8e4]">{entry.startTime} — {entry.endTime}</p><p className="mt-1 font-black text-[#eef7fb]">{entry.plannedLocation}</p>{entry.notes ? <p className="mt-1 line-clamp-1 text-xs text-[#7f9aa6]">{entry.notes}</p> : null}</div></AgendaCard>)}</div> : <EmptySection>No hay ubicaciones planificadas hoy.</EmptySection>}
      </section>
    </div>
  );
}

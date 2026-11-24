"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { TaskWorkspace } from "../hooks/use-task-workspace";
import { formatMoney } from "../lib/finance";
import { workspaceHref } from "../lib/module-navigation";
import { getMealTypeLabel, getPlanItemLabel } from "../lib/nutrition";
import { compareDateOnly, getSubjectPath, getSubjectEventLabel, sortedSubjectEvents } from "../lib/tasks";
import ui from "./workspace-screen.module.css";

type TodayModule = "calendar" | "finances" | "nutrition" | "locations" | "expectations";

const moduleLabels: Record<TodayModule, string> = {
  calendar: "Calendario",
  finances: "Finanzas",
  nutrition: "Nutrición",
  locations: "Ubicaciones",
  expectations: "Esperas",
};

function matchesQuery(query: string, ...values: Array<string | null | undefined>) {
  const normalized = query.trim().toLocaleLowerCase("es");
  return !normalized || values.join(" ").toLocaleLowerCase("es").includes(normalized);
}

function TodaySection({ id, title, count, view, children }: {
  id: string;
  title: string;
  count: number;
  view?: TodayModule;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={ui.panel}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-(--workspace-border) px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 id={id} className={ui.panelTitle}>{title}</h2>
          <span aria-hidden="true" className="rounded-md bg-(--workspace-selection) px-2 py-0.5 font-mono text-xs font-semibold text-(--accent) tabular-nums">{count}</span>
        </div>
        {view ? (
          <Link href={workspaceHref(view)} className={ui.button}>
            {moduleLabels[view]} <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function EmptySection({ children }: { children: ReactNode }) {
  return <p className="px-4 py-5 text-sm text-(--workspace-muted) sm:px-5">{children}</p>;
}

function AgendaCard({ children }: { children: ReactNode }) {
  return <article className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">{children}</article>;
}

const attentionClass = "w-fit rounded-md border border-[#8e5a55] bg-[#382526] px-2 py-0.5 text-xs font-semibold text-[#ffb5a9]";
const rowTitleClass = "wrap-anywhere text-sm font-semibold";
const rowMetaClass = "mt-1 wrap-anywhere text-xs text-(--workspace-muted)";
const rowsClass = "divide-y divide-(--workspace-border)";

export default function TodayOverview({ workspace, searchQuery, taskCount, taskContent }: {
  workspace: TaskWorkspace;
  searchQuery: string;
  taskCount: number;
  taskContent: ReactNode;
}) {
  const consumedPlanIds = new Set(
    workspace.nutritionIntakeEntries
      .filter((entry) => entry.date === workspace.today && entry.planItemId)
      .map((entry) => entry.planItemId),
  );
  const events = sortedSubjectEvents(workspace.subjectEvents).filter((event) =>
    event.date === workspace.today && matchesQuery(searchQuery, event.description, getSubjectPath(workspace.subjects, event.subjectId)),
  );
  const payments = workspace.finance.paymentsRequiringAttention.filter((payment) => {
    const account = payment.accountId ? workspace.finance.accountById.get(payment.accountId) : undefined;
    return matchesQuery(searchQuery, payment.description, payment.category, payment.currency, account?.name, payment.accountId ? undefined : "sin cuenta");
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
  const hasSearch = Boolean(searchQuery.trim());
  const summary = [
    { label: "Tareas", value: taskCount },
    { label: "Fechas clave", value: events.length },
    { label: "Pagos", value: payments.length },
    { label: "Esperas", value: expectations.length },
    { label: "Comidas", value: meals.length },
    { label: "Lugares", value: locations.length },
  ];

  if (visibleCount === 0) {
    return (
      <section className={`${ui.panel} px-4 py-10 text-center`} aria-labelledby="today-empty-title">
        <h2 id="today-empty-title" className={ui.panelTitle}>{hasSearch ? "Nada coincide en la agenda" : "Tu día está despejado"}</h2>
        <p role="status" className="mt-2 text-sm text-(--workspace-muted)">
          {hasSearch ? "Probá con otro término o limpiá la búsqueda." : "No hay acciones pendientes registradas para hoy."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {hasSearch ? <p role="status" className="sr-only">{visibleCount} {visibleCount === 1 ? "resultado" : "resultados"} en la agenda</p> : null}
      <section aria-label="Resumen del día" className={`${ui.panel} overflow-hidden`}>
        <dl className="grid grid-cols-2 gap-px bg-(--workspace-border) min-[375px]:grid-cols-3 lg:grid-cols-6">
          {summary.map(({ label, value }) => (
            <div key={label} className="grid gap-1 bg-(--workspace-surface) px-3 py-3 sm:px-5">
              <dt className="text-sm text-(--workspace-muted)">{label}</dt>
              <dd className={`font-mono text-xl font-semibold tabular-nums ${value > 0 ? "text-(--accent)" : "text-(--workspace-muted)"}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <TodaySection id="today-tasks" title="Tareas" count={taskCount}>
        {taskCount ? <div className="space-y-2 p-3 sm:p-4">{taskContent}</div> : (
          <EmptySection>{hasSearch ? "No hay tareas que coincidan." : "No hay tareas fechadas para hoy."}</EmptySection>
        )}
      </TodaySection>

      <div className="grid gap-5 xl:grid-cols-2">
        <TodaySection id="today-events" title="Eventos, hitos y vencimientos" count={events.length} view="calendar">
          {events.length ? (
            <div className={rowsClass}>
              {events.map((event) => (
                <AgendaCard key={event.id}>
                  <div className="min-w-0">
                    <p className="text-xs text-(--workspace-muted)">
                      {getSubjectEventLabel(event.kind)}{event.kind === "event" ? ` · ${event.startTime} – ${event.endTime}` : ""}
                    </p>
                    <Link href={workspaceHref("subjects", event.subjectId)} className={`${ui.backLink} inline-flex wrap-anywhere`}>
                      {event.description}
                    </Link>
                    <p className={rowMetaClass}>{getSubjectPath(workspace.subjects, event.subjectId)}</p>
                  </div>
                </AgendaCard>
              ))}
            </div>
          ) : <EmptySection>No hay eventos, hitos ni vencimientos hoy.</EmptySection>}
        </TodaySection>

        <TodaySection id="today-payments" title="Pagos que requieren atención" count={payments.length} view="finances">
          {payments.length ? (
            <div className={rowsClass}>
              {payments.map((payment) => {
                const account = payment.accountId ? workspace.finance.accountById.get(payment.accountId) : undefined;
                const overdue = compareDateOnly(payment.dueDate, workspace.today) < 0;
                return (
                  <AgendaCard key={payment.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={rowTitleClass}>{payment.description}</p>
                        {overdue ? <span className={attentionClass}>Vencido</span> : null}
                      </div>
                      <p className={rowMetaClass}>
                        {account?.name ?? "Sin cuenta definida"} · <span className="font-mono tabular-nums">{formatMoney(payment.amountMinor, payment.currency)}</span>
                      </p>
                    </div>
                    <button type="button" onClick={() => workspace.finance.setDuePaymentStatus(payment.id, "paid")} className={`${ui.button} justify-self-start`}>Marcar pagado</button>
                  </AgendaCard>
                );
              })}
            </div>
          ) : <EmptySection>No hay pagos pendientes para hoy.</EmptySection>}
        </TodaySection>

        <TodaySection id="today-expectations" title="Confirmaciones pendientes" count={expectations.length} view="expectations">
          {expectations.length ? (
            <div className={rowsClass}>
              {expectations.map((item) => (
                <AgendaCard key={item.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={rowTitleClass}>{item.title}</p>
                      {compareDateOnly(item.expectedDate, workspace.today) < 0 ? <span className={attentionClass}>Sin confirmar</span> : null}
                    </div>
                    <p className={rowMetaClass}>{item.source || "Esperado hoy"}{item.quantity ? ` · × ${item.quantity}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => workspace.updateExpectationStatus(item.id, "occurred")} className={ui.button}>Ocurrió</button>
                    <button type="button" onClick={() => workspace.updateExpectationStatus(item.id, "not_occurred")} className={ui.button}>No ocurrió</button>
                  </div>
                </AgendaCard>
              ))}
            </div>
          ) : <EmptySection>No hay confirmaciones pendientes para hoy.</EmptySection>}
        </TodaySection>

        <TodaySection id="today-meals" title="Comidas por registrar" count={meals.length} view="nutrition">
          {meals.length ? (
            <div className={rowsClass}>
              {meals.map((item) => (
                <AgendaCard key={item.id}>
                  <div className="min-w-0">
                    <p className="mb-1 text-xs text-(--workspace-muted)">{getMealTypeLabel(item.mealType)}</p>
                    <p className={rowTitleClass}>{getPlanItemLabel(item, workspace.nutritionFoods, workspace.nutritionRecipes)}</p>
                  </div>
                  <button type="button" onClick={() => workspace.consumeNutritionPlanItem(item.id)} className={`${ui.button} justify-self-start`}>Registrar</button>
                </AgendaCard>
              ))}
            </div>
          ) : <EmptySection>No quedan comidas planificadas por registrar.</EmptySection>}
        </TodaySection>
      </div>

      <TodaySection id="today-locations" title="Dónde tenés que estar" count={locations.length} view="locations">
        {locations.length ? (
          <div className={rowsClass}>
            {locations.map((entry) => (
              <AgendaCard key={entry.id}>
                <div className="min-w-0">
                  <p className="mb-1 font-mono text-xs text-(--accent) tabular-nums">{entry.startTime} — {entry.endTime}</p>
                  <p className={rowTitleClass}>{entry.plannedLocation}</p>
                  {entry.notes ? <p className={rowMetaClass}>{entry.notes}</p> : null}
                </div>
              </AgendaCard>
            ))}
          </div>
        ) : <EmptySection>No hay ubicaciones planificadas hoy.</EmptySection>}
      </TodaySection>
    </div>
  );
}

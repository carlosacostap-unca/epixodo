"use client";

import { type FormEvent, useMemo, useState } from "react";
import { minorAmountToInput, parseMinorAmount, type FinanceAccount, type FinanceDuePaymentDraft, type FinanceEntryDraft } from "../lib/finance";
import type { LocationEntryDraft } from "../lib/locations";
import { mealTypes, milliValueToInput, parseMilliValue, type NutritionHydrationDraft, type NutritionIntakeDraft } from "../lib/nutrition";
import { taskPriorities, type ExpectationDraft, type Subject, type SubjectEventDraft, type TaskAiSuggestion, type TaskPriority } from "../lib/tasks";

export type InboxSuggestionAction =
  | { type: "task"; draft: { title: string; notes: string; priority: TaskPriority; hacerEl: string | null; venceEl: string | null; subjectIds: string[] } }
  | { type: "finance_entry"; draft: FinanceEntryDraft }
  | { type: "finance_due_payment"; draft: FinanceDuePaymentDraft }
  | { type: "subject_event"; subjectId: string; draft: SubjectEventDraft }
  | { type: "location"; draft: LocationEntryDraft }
  | { type: "nutrition_hydration"; draft: NutritionHydrationDraft }
  | { type: "nutrition_intake"; draft: NutritionIntakeDraft }
  | { type: "expectation"; draft: ExpectationDraft };

const fieldClass = "h-10 w-full rounded-lg border border-[#36536f] bg-[#081722] px-3 text-sm font-semibold text-[#e7f1f7] outline-none transition placeholder:text-[#61768a] focus:border-[#7fd8d0] focus:ring-2 focus:ring-[#7fd8d0]/15";
const labelClass = "grid gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#7794a0]";

const labels: Record<TaskAiSuggestion["type"], { module: string; title: string; action: string }> = {
  task: { module: "Tareas", title: "Tarea sugerida", action: "Convertir en tarea" },
  finance_entry: { module: "Finanzas", title: "Movimiento sugerido", action: "Registrar movimiento" },
  finance_due_payment: { module: "Finanzas", title: "Pago pendiente sugerido", action: "Crear pago pendiente" },
  subject_event: { module: "Calendario", title: "Evento sugerido", action: "Crear evento" },
  location: { module: "Ubicaciones", title: "Ubicación sugerida", action: "Registrar ubicación" },
  nutrition_hydration: { module: "Nutrición", title: "Hidratación sugerida", action: "Registrar agua" },
  nutrition_intake: { module: "Nutrición", title: "Consumo sugerido", action: "Registrar consumo" },
  expectation: { module: "Esperas", title: "Espera sugerida", action: "Agregar a Esperas" },
};

export default function InboxAiSuggestion({ suggestion, accounts, subjects, today, onApply, onOpenModule }: {
  suggestion: TaskAiSuggestion;
  accounts: FinanceAccount[];
  subjects: Subject[];
  today: string;
  onApply: (action: InboxSuggestionAction) => void;
  onOpenModule: (module: "finances" | "subjects") => void;
}) {
  const compatibleAccounts = useMemo(() => "currency" in suggestion ? accounts.filter((account) => account.currency === suggestion.currency) : [], [accounts, suggestion]);
  const suggestedSubject = useMemo(() => "subjectName" in suggestion ? subjects.find((subject) => subject.name.toLocaleLowerCase("es") === suggestion.subjectName.toLocaleLowerCase("es")) : undefined, [subjects, suggestion]);
  const [accountId, setAccountId] = useState(compatibleAccounts[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(suggestedSubject?.id ?? "");
  const [fields, setFields] = useState<Record<string, string>>(() => suggestionFields(suggestion, today));
  const [error, setError] = useState("");
  const meta = labels[suggestion.type];
  const set = (key: string, value: string) => setFields((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const required = (...keys: string[]) => keys.every((key) => fields[key]?.trim());
    const amountMinor = parseMinorAmount(fields.amount ?? "");

    switch (suggestion.type) {
      case "task":
        if (!required("title")) return setError("Revisá el título sugerido.");
        onApply({ type: "task", draft: { title: fields.title.trim(), notes: fields.notes.trim(), priority: fields.priority as TaskPriority, hacerEl: fields.hacerEl || null, venceEl: fields.venceEl || null, subjectIds: subjectId ? [subjectId] : [] } });
        return;
      case "finance_entry":
        if (!accountId || !amountMinor || amountMinor <= 0 || !required("date", "description")) return setError(`Elegí una cuenta en ${suggestion.currency} y revisá fecha, descripción e importe.`);
        onApply({ type: "finance_entry", draft: { accountId, kind: fields.kind as "income" | "expense", date: fields.date, description: fields.description.trim(), amountMinor, category: fields.category.trim() } });
        return;
      case "finance_due_payment":
        if (!accountId || !amountMinor || amountMinor <= 0 || !required("dueDate", "description")) return setError(`Elegí una cuenta en ${suggestion.currency} y revisá vencimiento, descripción e importe.`);
        onApply({ type: "finance_due_payment", draft: { accountId, dueDate: fields.dueDate, description: fields.description.trim(), amountMinor, category: fields.category.trim() } });
        return;
      case "subject_event":
        if (!subjectId || !required("date", "description")) return setError("Elegí un asunto y revisá la fecha y la descripción.");
        onApply({ type: "subject_event", subjectId, draft: { kind: fields.kind as "milestone" | "deadline", date: fields.date, description: fields.description.trim() } });
        return;
      case "location":
        if (!required("date", "startTime", "endTime", "plannedLocation") || fields.startTime >= fields.endTime) return setError("Revisá la fecha, el horario y el lugar sugeridos.");
        onApply({ type: "location", draft: { date: fields.date, startTime: fields.startTime, endTime: fields.endTime, plannedLocation: fields.plannedLocation.trim(), actualLocation: fields.actualLocation.trim(), notes: fields.notes.trim() } });
        return;
      case "nutrition_hydration": {
        const amountMl = Number(fields.amountMl);
        if (!required("date") || !Number.isSafeInteger(amountMl) || amountMl <= 0) return setError("Revisá la fecha y los mililitros sugeridos.");
        onApply({ type: "nutrition_hydration", draft: { date: fields.date, amountMl } });
        return;
      }
      case "nutrition_intake": {
        const quantityMilli = parseMilliValue(fields.quantity);
        const nutrient = (key: string) => parseMilliValue(fields[key], { allowZero: true });
        const energyKcalMilli = nutrient("energyKcal"); const proteinGramsMilli = nutrient("proteinGrams");
        const carbsGramsMilli = nutrient("carbsGrams"); const fatGramsMilli = nutrient("fatGrams"); const fiberGramsMilli = nutrient("fiberGrams");
        if (!required("date", "description", "unitLabel") || !quantityMilli || [energyKcalMilli, proteinGramsMilli, carbsGramsMilli, fatGramsMilli, fiberGramsMilli].some((value) => value === null)) return setError("Revisá la comida, cantidad y valores nutricionales sugeridos.");
        onApply({ type: "nutrition_intake", draft: { date: fields.date, mealType: fields.mealType as NutritionIntakeDraft["mealType"], description: fields.description.trim(), quantityMilli, unitLabel: fields.unitLabel.trim(), energyKcalMilli: energyKcalMilli!, proteinGramsMilli: proteinGramsMilli!, carbsGramsMilli: carbsGramsMilli!, fatGramsMilli: fatGramsMilli!, fiberGramsMilli: fiberGramsMilli!, sourceType: null, sourceId: null, planItemId: null } });
        return;
      }
      case "expectation": {
        const quantity = fields.quantity ? Number(fields.quantity) : null;
        if (!required("title", "expectedDate") || !(quantity === null || (Number.isSafeInteger(quantity) && quantity > 0))) return setError("Revisá el título, la fecha esperada y la cantidad.");
        onApply({ type: "expectation", draft: { title: fields.title.trim(), expectedDate: fields.expectedDate, notes: fields.notes.trim(), source: fields.source.trim(), quantity } });
      }
    }
  }

  const needsAccount = suggestion.type === "finance_entry" || suggestion.type === "finance_due_payment";
  const needsSubject = suggestion.type === "subject_event";

  return (
    <form onSubmit={submit} className="relative overflow-hidden rounded-2xl border border-[#35647a] bg-[linear-gradient(135deg,#0d2934,#0d202d_58%,#101d2b)] p-4 shadow-[inset_0_1px_0_rgba(127,216,208,0.08)] sm:col-start-3" aria-label={meta.title}>
      <div aria-hidden="true" className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#7fd8d0]/[0.06] blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#3f807e] bg-[#123b3d] px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#91e5dc]">Sugerencia de IA</span><span className="rounded-full border border-[#36536f] px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#9bb8ca]">{meta.module}</span></div><p className="mt-3 text-base font-black text-[#f1fbfa]">{meta.title}</p></div>
        <p className="max-w-xs text-right text-xs leading-5 text-[#76919e]">Los campos son editables. Nada se registra hasta que confirmes.</p>
      </div>

      {needsAccount && compatibleAccounts.length === 0 ? <MissingDependency title={`Falta una cuenta en ${suggestion.currency}`} action="Abrir Finanzas" onClick={() => onOpenModule("finances")} /> : null}
      {needsSubject && subjects.length === 0 ? <MissingDependency title="Falta crear un asunto" action="Abrir Asuntos" onClick={() => onOpenModule("subjects")} /> : null}

      {(!needsAccount || compatibleAccounts.length > 0) && (!needsSubject || subjects.length > 0) ? (
        <div className="relative mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {needsAccount ? <Select label="Cuenta" value={accountId} onChange={setAccountId}>{compatibleAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</Select> : null}
          {(suggestion.type === "task" || suggestion.type === "subject_event") ? <Select label="Asunto" value={subjectId} onChange={setSubjectId}><option value="">Sin asunto</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</Select> : null}
          <SuggestionFields suggestion={suggestion} fields={fields} set={set} />
          <button type="submit" className="self-end rounded-lg bg-[#7fd8d0] px-4 py-2.5 text-sm font-black text-[#062021] shadow-[0_8px_22px_rgba(127,216,208,0.14)] transition hover:-translate-y-0.5 hover:bg-[#a6eee7] focus:outline-none focus:ring-2 focus:ring-[#7fd8d0]/35">{meta.action}</button>
        </div>
      ) : null}
      {error ? <p role="alert" className="relative mt-3 rounded-lg border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm font-semibold text-[#ffafa5]">{error}</p> : null}
    </form>
  );
}

function SuggestionFields({ suggestion, fields, set }: { suggestion: TaskAiSuggestion; fields: Record<string, string>; set: (key: string, value: string) => void }) {
  const input = (label: string, key: string, type = "text", span = "") => <label className={`${labelClass} ${span}`}>{label}<input type={type} value={fields[key] ?? ""} onChange={(event) => set(key, event.target.value)} className={fieldClass} /></label>;
  switch (suggestion.type) {
    case "task": return <>{input("Título", "title", "text", "md:col-span-2")}<Select label="Prioridad" value={fields.priority} onChange={(value) => set("priority", value)}>{taskPriorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>{input("Hacer el", "hacerEl", "date")}{input("Vence el", "venceEl", "date")}{input("Notas", "notes", "text", "md:col-span-2 xl:col-span-3")}</>;
    case "finance_entry": return <><Select label="Tipo" value={fields.kind} onChange={(value) => set("kind", value)}><option value="expense">Gasto</option><option value="income">Ingreso</option></Select>{input("Fecha", "date", "date")}{input(`Importe (${suggestion.currency})`, "amount")}{input("Categoría", "category")}{input("Descripción", "description", "text", "md:col-span-2 xl:col-span-3")}</>;
    case "finance_due_payment": return <>{input("Vencimiento", "dueDate", "date")}{input(`Importe (${suggestion.currency})`, "amount")}{input("Categoría", "category")}{input("Descripción", "description", "text", "md:col-span-2 xl:col-span-3")}</>;
    case "subject_event": return <><Select label="Tipo" value={fields.kind} onChange={(value) => set("kind", value)}><option value="deadline">Fecha límite</option><option value="milestone">Hito</option></Select>{input("Fecha", "date", "date")}{input("Descripción", "description", "text", "md:col-span-2 xl:col-span-3")}</>;
    case "location": return <>{input("Fecha", "date", "date")}{input("Desde", "startTime", "time")}{input("Hasta", "endTime", "time")}{input("Lugar previsto", "plannedLocation")}{input("Lugar real", "actualLocation")}{input("Notas", "notes", "text", "md:col-span-2")}</>;
    case "nutrition_hydration": return <>{input("Fecha", "date", "date")}{input("Cantidad (ml)", "amountMl")}</>;
    case "nutrition_intake": return <>{input("Fecha", "date", "date")}<Select label="Comida" value={fields.mealType} onChange={(value) => set("mealType", value)}>{mealTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>{input("Descripción", "description", "text", "md:col-span-2")}{input("Cantidad", "quantity")}{input("Unidad", "unitLabel")}{input("Energía (kcal)", "energyKcal")}{input("Proteínas (g)", "proteinGrams")}{input("Carbohidratos (g)", "carbsGrams")}{input("Grasas (g)", "fatGrams")}{input("Fibra (g)", "fiberGrams")}</>;
    case "expectation": return <>{input("Fecha esperada", "expectedDate", "date")}{input("Cantidad", "quantity")}{input("Origen", "source")}{input("Qué esperás", "title", "text", "md:col-span-2")}{input("Notas", "notes", "text", "md:col-span-2")}</>;
  }
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className={labelClass}>{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>{children}</select></label>;
}

function MissingDependency({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return <div className="relative mt-4 rounded-xl border border-[#735d35] bg-[#2b2417] px-4 py-3"><p className="text-sm font-bold text-[#f6c177]">{title}</p><button type="button" onClick={onClick} className="mt-3 rounded-lg border border-[#8c7547] px-3 py-2 text-xs font-black text-[#f6c177] transition hover:bg-[#3a301e]">{action}</button></div>;
}

function suggestionFields(suggestion: TaskAiSuggestion, today: string): Record<string, string> {
  switch (suggestion.type) {
    case "task": return { title: suggestion.title, notes: suggestion.notes, priority: suggestion.priority, hacerEl: suggestion.hacerEl ?? "", venceEl: suggestion.venceEl ?? "" };
    case "finance_entry": return { kind: suggestion.kind, description: suggestion.description, amount: minorAmountToInput(suggestion.amountMinor), category: suggestion.category, date: suggestion.date ?? today };
    case "finance_due_payment": return { description: suggestion.description, amount: minorAmountToInput(suggestion.amountMinor), category: suggestion.category, dueDate: suggestion.dueDate ?? "" };
    case "subject_event": return { kind: suggestion.kind, description: suggestion.description, date: suggestion.date ?? "" };
    case "location": return { date: suggestion.date ?? today, startTime: suggestion.startTime, endTime: suggestion.endTime, plannedLocation: suggestion.plannedLocation, actualLocation: suggestion.actualLocation, notes: suggestion.notes };
    case "nutrition_hydration": return { date: suggestion.date ?? today, amountMl: String(suggestion.amountMl) };
    case "nutrition_intake": return { date: suggestion.date ?? today, mealType: suggestion.mealType, description: suggestion.description, quantity: milliValueToInput(suggestion.quantityMilli), unitLabel: suggestion.unitLabel, energyKcal: milliValueToInput(suggestion.energyKcalMilli), proteinGrams: milliValueToInput(suggestion.proteinGramsMilli), carbsGrams: milliValueToInput(suggestion.carbsGramsMilli), fatGrams: milliValueToInput(suggestion.fatGramsMilli), fiberGrams: milliValueToInput(suggestion.fiberGramsMilli) };
    case "expectation": return { title: suggestion.title, notes: suggestion.notes, expectedDate: suggestion.expectedDate ?? "", quantity: suggestion.quantity ? String(suggestion.quantity) : "", source: suggestion.source };
  }
}

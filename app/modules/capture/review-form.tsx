"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useWorkspaceDraft } from "../../components/workspace-provider";
import { minorAmountToInput, parseMinorAmount, type FinanceAccount } from "../../lib/finance";
import type { CaptureAction } from "./actions";
import { mealTypes, milliValueToInput, parseMilliValue, type NutritionIntakeDraft } from "../../lib/nutrition";
import { taskPriorities, type Subject, type TaskAiSuggestion, type TaskPriority } from "../../lib/tasks";

const fieldClass = "h-10 w-full rounded-lg border border-[#574d41] bg-[#191815] px-3 text-sm font-semibold text-[#f5eee3] outline-none transition placeholder:text-[#a59a89] focus:border-[#ffcb7e] focus:ring-2 focus:ring-[#ffcb7e]/15";
const labelClass = "grid gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#c0b5a7]";

const labels: Record<TaskAiSuggestion["type"], { module: string; title: string; action: string }> = {
  task: { module: "Planificación", title: "Tarea sugerida", action: "Convertir en tarea" },
  finance_entry: { module: "Finanzas", title: "Movimiento sugerido", action: "Registrar movimiento" },
  finance_due_payment: { module: "Finanzas", title: "Pago pendiente sugerido", action: "Crear pago pendiente" },
  subject_event: { module: "Calendario", title: "Evento sugerido", action: "Crear evento" },
  location: { module: "Ubicaciones", title: "Ubicación sugerida", action: "Registrar ubicación" },
  nutrition_hydration: { module: "Nutrición", title: "Hidratación sugerida", action: "Registrar agua" },
  nutrition_intake: { module: "Nutrición", title: "Consumo sugerido", action: "Registrar consumo" },
  expectation: { module: "Esperas", title: "Espera sugerida", action: "Agregar a Esperas" },
};

export function captureDestination(suggestion: TaskAiSuggestion | null) {
  return labels[suggestion?.type ?? "task"].module;
}

export default function ReviewForm({ entryId, suggestion, accounts, subjects, today, applyError, isSuggested, onApply, onOpenModule }: {
  entryId: string;
  suggestion: TaskAiSuggestion;
  accounts: FinanceAccount[];
  subjects: Subject[];
  today: string;
  applyError?: string;
  isSuggested: boolean;
  onApply: (action: CaptureAction) => void;
  onOpenModule: (module: "finances" | "subjects") => void;
}) {
  const compatibleAccounts = useMemo(() => "currency" in suggestion ? accounts.filter((account) => account.currency === suggestion.currency) : [], [accounts, suggestion]);
  const suggestedSubject = useMemo(() => "subjectName" in suggestion ? subjects.find((subject) => subject.name.toLocaleLowerCase("es") === suggestion.subjectName.toLocaleLowerCase("es")) : undefined, [subjects, suggestion]);
  const [accountId, setAccountId] = useWorkspaceDraft(`review:${entryId}:account`,
    () => suggestion.type === "finance_entry" ? compatibleAccounts[0]?.id ?? "" : "",
  );
  const [subjectId, setSubjectId] = useWorkspaceDraft(`review:${entryId}:subject`, () => suggestedSubject?.id ?? "");
  const [fields, setFields] = useWorkspaceDraft(`review:${entryId}:fields`, () => suggestionFields(suggestion, today));
  const [error, setError] = useState("");
  const meta = labels[suggestion.type];
  const formName = isSuggested ? meta.title : "Tarea de Planificación";
  const set = (key: string, value: string) => setFields({ ...fields, [key]: value });

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
        onApply({ type: "finance_entry", currency: suggestion.currency, draft: { accountId, kind: fields.kind as "income" | "expense", date: fields.date, description: fields.description.trim(), amountMinor, category: fields.category.trim() } });
        return;
      case "finance_due_payment":
        if (!amountMinor || amountMinor <= 0 || !required("dueDate", "description")) return setError("Revisá vencimiento, descripción e importe.");
        onApply({ type: "finance_due_payment", draft: { accountId: accountId || null, currency: suggestion.currency, dueDate: fields.dueDate, description: fields.description.trim(), amountMinor, category: fields.category.trim() } });
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

  const usesAccount = suggestion.type === "finance_entry" || suggestion.type === "finance_due_payment";
  const requiresAccount = suggestion.type === "finance_entry";
  const accountUnavailable = !!accountId && !compatibleAccounts.some(({ id }) => id === accountId);
  const needsSubject = suggestion.type === "subject_event";

  return (
    <form onSubmit={submit} aria-label={formName}>
      <h3 className="font-serif text-2xl tracking-tight text-[#f5eee3]">{formName}</h3>
      <p className="mt-1 text-sm text-[#c0b5a7]">Destino · <strong className="font-medium text-[#ffd08a]">{meta.module}</strong></p>

      {requiresAccount && compatibleAccounts.length === 0 ? <MissingDependency title={`Falta una cuenta en ${suggestion.currency}`} action="Abrir Finanzas" onClick={() => onOpenModule("finances")} /> : null}
      {needsSubject && subjects.length === 0 ? <MissingDependency title="Falta crear un asunto" action="Abrir Asuntos" onClick={() => onOpenModule("subjects")} /> : null}

      {(!requiresAccount || compatibleAccounts.length > 0) && (!needsSubject || subjects.length > 0) ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {usesAccount ? (
            <Select label={requiresAccount ? "Cuenta" : "Cuenta (opcional)"} value={accountId} onChange={setAccountId}>
              {accountUnavailable ? <option value={accountId} disabled>Cuenta anterior no disponible</option> : null}
              {!requiresAccount ? <option value="">Sin cuenta definida</option> : null}
              {compatibleAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </Select>
          ) : null}
          {(suggestion.type === "task" || suggestion.type === "subject_event") ? <Select label="Asunto" value={subjectId} onChange={setSubjectId}><option value="">Sin asunto</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</Select> : null}
          <SuggestionFields suggestion={suggestion} fields={fields} set={set} />
          <button type="submit" className="min-h-11 justify-self-start rounded-lg bg-[#ffcb7e] px-4 py-2.5 text-sm font-bold text-[#21180d] transition hover:bg-[#ffd08a] sm:col-span-2">{meta.action}</button>
        </div>
      ) : null}
      {error || applyError ? <p role="alert" className="mt-3 rounded-lg border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm font-semibold text-[#ffafa5]">{error || applyError}</p> : null}
    </form>
  );
}

function SuggestionFields({ suggestion, fields, set }: { suggestion: TaskAiSuggestion; fields: Record<string, string>; set: (key: string, value: string) => void }) {
  const input = (label: string, key: string, type = "text", span = "") => <label className={`${labelClass} ${span}`}>{label}<input type={type} value={fields[key] ?? ""} onChange={(event) => set(key, event.target.value)} className={fieldClass} /></label>;
  switch (suggestion.type) {
    case "task": return <>{input("Título", "title", "text", "sm:col-span-2")}<Select label="Prioridad" value={fields.priority} onChange={(value) => set("priority", value)}>{taskPriorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>{input("Hacer el", "hacerEl", "date")}{input("Vence el", "venceEl", "date")}<label className={labelClass + " sm:col-span-2"}>Notas<textarea value={fields.notes} onChange={(event) => set("notes", event.target.value)} className={fieldClass + " min-h-20 py-2"} /></label></>;
    case "finance_entry": return <><Select label="Tipo" value={fields.kind} onChange={(value) => set("kind", value)}><option value="expense">Gasto</option><option value="income">Ingreso</option></Select>{input("Fecha", "date", "date")}{input(`Importe (${suggestion.currency})`, "amount")}{input("Categoría", "category")}{input("Descripción", "description", "text", "sm:col-span-2")}</>;
    case "finance_due_payment": return <>{input("Vencimiento", "dueDate", "date")}{input(`Importe (${suggestion.currency})`, "amount")}{input("Categoría", "category")}{input("Descripción", "description", "text", "sm:col-span-2")}</>;
    case "subject_event": return <><Select label="Tipo" value={fields.kind} onChange={(value) => set("kind", value)}><option value="deadline">Fecha límite</option><option value="milestone">Hito</option></Select>{input("Fecha", "date", "date")}{input("Descripción", "description", "text", "sm:col-span-2")}</>;
    case "location": return <>{input("Fecha", "date", "date")}{input("Desde", "startTime", "time")}{input("Hasta", "endTime", "time")}{input("Lugar previsto", "plannedLocation")}{input("Lugar real", "actualLocation")}{input("Notas", "notes", "text", "sm:col-span-2")}</>;
    case "nutrition_hydration": return <>{input("Fecha", "date", "date")}{input("Cantidad (ml)", "amountMl")}</>;
    case "nutrition_intake": return <>{input("Fecha", "date", "date")}<Select label="Comida" value={fields.mealType} onChange={(value) => set("mealType", value)}>{mealTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>{input("Descripción", "description", "text", "sm:col-span-2")}{input("Cantidad", "quantity")}{input("Unidad", "unitLabel")}{input("Energía (kcal)", "energyKcal")}{input("Proteínas (g)", "proteinGrams")}{input("Carbohidratos (g)", "carbsGrams")}{input("Grasas (g)", "fatGrams")}{input("Fibra (g)", "fiberGrams")}</>;
    case "expectation": return <>{input("Fecha esperada", "expectedDate", "date")}{input("Cantidad", "quantity")}{input("Origen", "source")}{input("Qué esperás", "title", "text", "sm:col-span-2")}{input("Notas", "notes", "text", "sm:col-span-2")}</>;
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

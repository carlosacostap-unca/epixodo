"use client";

import { FormEvent, useMemo, useState } from "react";
import type { TaskWorkspace } from "../hooks/use-task-workspace";
import {
  financeAccountTypes,
  formatMoney,
  getFinanceAccountTypeLabel,
  getFinanceDuePaymentUrgency,
  minorAmountToInput,
  parseMinorAmount,
  type FinanceAccount,
  type FinanceAccountDraft,
  type FinanceAccountType,
  type FinanceEntry,
  type FinanceEntryDraft,
  type FinanceEntryKind,
  type FinanceDuePayment,
  type FinanceDuePaymentDraft,
} from "../lib/finance";

const financeControlClass =
  "h-11 w-full rounded-xl border border-[#324968] bg-[#091522] px-3 text-sm text-[#e8eef8] outline-none transition placeholder:text-[#61708d] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15";

function FinanceField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8292ad]">
      {label}
      {children}
      {hint ? <span className="text-[11px] font-medium normal-case tracking-normal text-[#6f819e]">{hint}</span> : null}
    </label>
  );
}

function FinanceModal({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#030811]/80 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="finance-modal-title">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#355071] bg-[#0d1928] shadow-[0_30px_100px_rgba(0,0,0,0.52)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#263b57] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#82afff]">{eyebrow}</p>
            <h3 id="finance-modal-title" className="mt-1 text-xl font-black tracking-[-0.02em] text-[#f2f6fc]">{title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#344c6d] text-lg font-bold text-[#b5c2d7] transition hover:bg-[#17283e]">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AccountForm({
  account,
  entryCount,
  onSave,
  onDelete,
  onClose,
}: {
  account: FinanceAccount | null;
  entryCount: number;
  onSave: (draft: FinanceAccountDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<FinanceAccountType>(account?.type ?? "bank");
  const [currency, setCurrency] = useState(account?.currency ?? "ARS");
  const [openingBalance, setOpeningBalance] = useState(
    account ? minorAmountToInput(account.openingBalanceMinor) : "0,00",
  );
  const [error, setError] = useState("");
  const currencyLocked = Boolean(account && entryCount > 0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = parseMinorAmount(openingBalance);
    const normalizedCurrency = currency.trim().toUpperCase();

    if (!name.trim()) {
      setError("Escribí un nombre para la cuenta.");
      return;
    }
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError("La moneda debe tener tres letras, por ejemplo ARS o USD.");
      return;
    }
    if (amountMinor === null) {
      setError("El saldo inicial admite hasta dos decimales.");
      return;
    }

    onSave({ name: name.trim(), type, currency: normalizedCurrency, openingBalanceMinor: amountMinor });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-5">
      <FinanceField label="Nombre">
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Cuenta sueldo" className={financeControlClass} />
      </FinanceField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceField label="Tipo">
          <select value={type} onChange={(event) => setType(event.target.value as FinanceAccountType)} className={financeControlClass}>
            {financeAccountTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </FinanceField>
        <FinanceField label="Moneda" hint={currencyLocked ? "No puede cambiarse mientras haya movimientos." : "Código de tres letras."}>
          <input value={currency} disabled={currencyLocked} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} className={`${financeControlClass} font-mono uppercase`} />
        </FinanceField>
      </div>
      <FinanceField label="Saldo inicial" hint="Puede ser negativo; admite hasta dos decimales.">
        <input inputMode="decimal" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} className={`${financeControlClass} font-mono`} />
      </FinanceField>
      {error ? <p role="alert" className="rounded-xl border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm font-semibold text-[#ff9d88]">{error}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#263b57] pt-4">
        {onDelete ? <button type="button" onClick={onDelete} className="rounded-xl border border-[#713d3a] px-4 py-2.5 text-sm font-bold text-[#ff9d88] transition hover:bg-[#2e1716]">Eliminar cuenta</button> : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#344c6d] px-4 py-2.5 text-sm font-bold text-[#b8c5d9] transition hover:bg-[#17283e]">Cancelar</button>
          <button type="submit" className="rounded-xl bg-[#82afff] px-4 py-2.5 text-sm font-black text-[#07111f] transition hover:bg-[#a8c7ff]">Guardar cuenta</button>
        </div>
      </div>
    </form>
  );
}

function EntryForm({
  entry,
  accounts,
  today,
  defaultKind,
  onSave,
  onClose,
}: {
  entry: FinanceEntry | null;
  accounts: FinanceAccount[];
  today: string;
  defaultKind: FinanceEntryKind;
  onSave: (draft: FinanceEntryDraft) => void;
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState(entry?.accountId ?? accounts[0]?.id ?? "");
  const [kind, setKind] = useState<FinanceEntryKind>(entry?.kind ?? defaultKind);
  const [date, setDate] = useState(entry?.date ?? today);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [amount, setAmount] = useState(entry ? minorAmountToInput(entry.amountMinor) : "");
  const [category, setCategory] = useState(entry?.category ?? "");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = parseMinorAmount(amount);

    if (!accountId) {
      setError("Elegí una cuenta para el movimiento.");
      return;
    }
    if (!description.trim()) {
      setError("Escribí una descripción.");
      return;
    }
    if (!date) {
      setError("Elegí una fecha válida.");
      return;
    }
    if (amountMinor === null || amountMinor <= 0) {
      setError("El importe debe ser mayor que cero y tener hasta dos decimales.");
      return;
    }

    onSave({ accountId, kind, date, description: description.trim(), amountMinor, category: category.trim() });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-5">
      <div className="grid grid-cols-2 rounded-xl border border-[#304865] bg-[#091522] p-1">
        {(["expense", "income"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setKind(value)} className={`h-10 rounded-lg text-sm font-black transition ${kind === value ? value === "income" ? "bg-[#63d3a5] text-[#071b14]" : "bg-[#ff927d] text-[#28100d]" : "text-[#9aacbf] hover:bg-[#15263b]"}`}>
            {value === "income" ? "Ingreso" : "Egreso"}
          </button>
        ))}
      </div>
      <FinanceField label="Cuenta">
        <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className={financeControlClass}>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}
        </select>
      </FinanceField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceField label="Fecha">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={financeControlClass} />
        </FinanceField>
        <FinanceField label="Importe" hint="Siempre mayor que cero.">
          <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" className={`${financeControlClass} font-mono`} />
        </FinanceField>
      </div>
      <FinanceField label="Descripción">
        <input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Supermercado, honorarios, alquiler…" className={financeControlClass} />
      </FinanceField>
      <FinanceField label="Categoría" hint="Opcional">
        <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Comida, trabajo, vivienda…" className={financeControlClass} />
      </FinanceField>
      {error ? <p role="alert" className="rounded-xl border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm font-semibold text-[#ff9d88]">{error}</p> : null}
      <div className="flex justify-end gap-2 border-t border-[#263b57] pt-4">
        <button type="button" onClick={onClose} className="rounded-xl border border-[#344c6d] px-4 py-2.5 text-sm font-bold text-[#b8c5d9] transition hover:bg-[#17283e]">Cancelar</button>
        <button type="submit" className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${kind === "income" ? "bg-[#63d3a5] text-[#071b14] hover:bg-[#8ce3bf]" : "bg-[#ff927d] text-[#28100d] hover:bg-[#ffb09f]"}`}>Guardar {kind === "income" ? "ingreso" : "egreso"}</button>
      </div>
    </form>
  );
}

function DuePaymentForm({
  payment,
  accounts,
  today,
  onSave,
  onClose,
}: {
  payment: FinanceDuePayment | null;
  accounts: FinanceAccount[];
  today: string;
  onSave: (draft: FinanceDuePaymentDraft) => void;
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState(payment?.accountId ?? accounts[0]?.id ?? "");
  const [description, setDescription] = useState(payment?.description ?? "");
  const [amount, setAmount] = useState(payment ? minorAmountToInput(payment.amountMinor) : "");
  const [dueDate, setDueDate] = useState(payment?.dueDate ?? today);
  const [category, setCategory] = useState(payment?.category ?? "");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = parseMinorAmount(amount);

    if (!accountId) {
      setError("Elegí la cuenta desde la que pensás pagar.");
      return;
    }
    if (!description.trim()) {
      setError("Escribí qué pago tenés que realizar.");
      return;
    }
    if (!dueDate) {
      setError("Elegí una fecha de vencimiento válida.");
      return;
    }
    if (amountMinor === null || amountMinor <= 0) {
      setError("El importe debe ser mayor que cero y tener hasta dos decimales.");
      return;
    }

    onSave({
      accountId,
      description: description.trim(),
      amountMinor,
      dueDate,
      category: category.trim(),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-5">
      <FinanceField label="Cuenta" hint="El pago pendiente no modifica el saldo hasta que registres el egreso.">
        <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className={financeControlClass}>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}
        </select>
      </FinanceField>
      <FinanceField label="Descripción">
        <input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Alquiler, tarjeta, servicio…" className={financeControlClass} />
      </FinanceField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceField label="Importe" hint="Siempre mayor que cero.">
          <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" className={`${financeControlClass} font-mono`} />
        </FinanceField>
        <FinanceField label="Fecha de vencimiento">
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={financeControlClass} />
        </FinanceField>
      </div>
      <FinanceField label="Categoría" hint="Opcional">
        <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Vivienda, servicios, impuestos…" className={financeControlClass} />
      </FinanceField>
      {error ? <p role="alert" className="rounded-xl border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm font-semibold text-[#ff9d88]">{error}</p> : null}
      <div className="flex justify-end gap-2 border-t border-[#263b57] pt-4">
        <button type="button" onClick={onClose} className="rounded-xl border border-[#344c6d] px-4 py-2.5 text-sm font-bold text-[#b8c5d9] transition hover:bg-[#17283e]">Cancelar</button>
        <button type="submit" className="rounded-xl bg-[#f4c36a] px-4 py-2.5 text-sm font-black text-[#281b05] transition hover:bg-[#ffda8c]">Guardar pago</button>
      </div>
    </form>
  );
}

export default function FinanceView({
  workspace,
  searchQuery,
}: {
  workspace: TaskWorkspace;
  searchQuery: string;
}) {
  const [accountModalId, setAccountModalId] = useState<string | "new" | null>(null);
  const [entryModal, setEntryModal] = useState<{ id: string | null; kind: FinanceEntryKind } | null>(null);
  const [duePaymentModalId, setDuePaymentModalId] = useState<string | "new" | null>(null);
  const selectedAccount = accountModalId && accountModalId !== "new"
    ? workspace.financeAccounts.find((account) => account.id === accountModalId) ?? null
    : null;
  const selectedEntry = entryModal?.id
    ? workspace.financeEntries.find((entry) => entry.id === entryModal.id) ?? null
    : null;
  const selectedDuePayment = duePaymentModalId && duePaymentModalId !== "new"
    ? workspace.financeDuePayments.find((payment) => payment.id === duePaymentModalId) ?? null
    : null;
  const accountById = useMemo(
    () => new Map(workspace.financeAccounts.map((account) => [account.id, account])),
    [workspace.financeAccounts],
  );
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("es");
  const visibleEntries = workspace.recentFinanceEntries.filter((entry) => {
    if (!normalizedQuery) return true;
    const account = accountById.get(entry.accountId);
    return `${entry.description} ${entry.category} ${account?.name ?? ""} ${entry.kind}`
      .toLocaleLowerCase("es")
      .includes(normalizedQuery);
  });
  const visibleDuePayments = workspace.orderedFinanceDuePayments.filter((payment) => {
    if (!normalizedQuery) return true;
    const account = accountById.get(payment.accountId);
    return `${payment.description} ${payment.category} ${account?.name ?? ""} ${payment.status}`
      .toLocaleLowerCase("es")
      .includes(normalizedQuery);
  });
  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(`${workspace.today.slice(0, 7)}-01T12:00:00`),
  );

  function confirmAccountDelete(account: FinanceAccount) {
    const entryCount = workspace.financeEntries.filter((entry) => entry.accountId === account.id).length;
    const paymentCount = workspace.financeDuePayments.filter((payment) => payment.accountId === account.id).length;
    if (window.confirm(`Eliminar “${account.name}” también eliminará ${entryCount} ${entryCount === 1 ? "movimiento" : "movimientos"} y ${paymentCount} ${paymentCount === 1 ? "pago programado" : "pagos programados"}. Esta acción no se puede deshacer.`)) {
      workspace.deleteFinanceAccount(account.id);
      setAccountModalId(null);
    }
  }

  function confirmEntryDelete(entry: FinanceEntry) {
    if (window.confirm(`¿Eliminar el movimiento “${entry.description}”? El saldo se recalculará.`)) {
      workspace.deleteFinanceEntry(entry.id);
    }
  }

  function confirmDuePaymentDelete(payment: FinanceDuePayment) {
    if (window.confirm(`¿Eliminar el pago “${payment.description}”? Esta acción no se puede deshacer.`)) {
      workspace.deleteFinanceDuePayment(payment.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#315177] bg-[linear-gradient(135deg,#10233a,#0c1928)] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.16)] sm:p-5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#82afff]">Libro diario</p>
          <p className="mt-1 text-sm text-[#92a3bb]">Registrá el movimiento; el saldo se actualiza solo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAccountModalId("new")} className="rounded-xl border border-[#3b5678] px-4 py-2.5 text-sm font-bold text-[#c4d0e1] transition hover:bg-[#182a42]">+ Cuenta</button>
          <button type="button" disabled={workspace.financeAccounts.length === 0} onClick={() => setDuePaymentModalId("new")} className="rounded-xl border border-[#7d6330] bg-[#2c2415] px-4 py-2.5 text-sm font-black text-[#f4c36a] transition hover:-translate-y-0.5 hover:bg-[#3a2e19] disabled:cursor-not-allowed disabled:opacity-40">+ Pago pendiente</button>
          <button type="button" disabled={workspace.financeAccounts.length === 0} onClick={() => setEntryModal({ id: null, kind: "expense" })} className="rounded-xl border border-[#ff927d] bg-[#ff927d] px-4 py-2.5 text-sm font-black text-[#28100d] transition hover:-translate-y-0.5 hover:bg-[#ffb09f]">− Egreso</button>
          <button type="button" disabled={workspace.financeAccounts.length === 0} onClick={() => setEntryModal({ id: null, kind: "income" })} className="rounded-xl border border-[#63d3a5] bg-[#63d3a5] px-4 py-2.5 text-sm font-black text-[#071b14] transition hover:-translate-y-0.5 hover:bg-[#8ce3bf]">+ Ingreso</button>
        </div>
      </div>

      {workspace.financeSummaries.length > 0 ? (
        <section aria-labelledby="finance-summary-title" className="overflow-hidden rounded-2xl border border-[#304a6c] bg-[#0b1725]">
          <div className="grid gap-3 border-b border-[#263b57] px-4 py-4 sm:flex sm:items-end sm:justify-between sm:px-5">
            <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7185a3]">Estado por moneda</p><h3 id="finance-summary-title" className="mt-1 text-lg font-black text-[#edf3fb]">{monthLabel}</h3></div>
            <p className="max-w-xs text-left text-xs leading-5 text-[#7185a3] sm:text-right">Cada moneda conserva su propia columna; no se aplican conversiones.</p>
          </div>
          <div className="divide-y divide-[#263b57]">
            {workspace.financeSummaries.map((summary) => (
              <div key={summary.currency} className="grid gap-4 px-4 py-5 sm:grid-cols-[72px_repeat(3,minmax(0,1fr))] sm:items-end sm:px-5">
                <span className="w-fit rounded-lg border border-[#3f6089] bg-[#152a43] px-2.5 py-1 font-mono text-xs font-black tracking-[0.12em] text-[#a9c9f8]">{summary.currency}</span>
                <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7185a3]">Saldo actual</p><p className="mt-1 font-mono text-xl font-black text-[#edf3fb]">{formatMoney(summary.balanceMinor, summary.currency)}</p></div>
                <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#4fae88]">Ingresos del mes</p><p className="mt-1 font-mono text-lg font-black text-[#63d3a5]">+ {formatMoney(summary.incomeMinor, summary.currency)}</p></div>
                <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d57565]">Egresos del mes</p><p className="mt-1 font-mono text-lg font-black text-[#ff927d]">− {formatMoney(summary.expenseMinor, summary.currency)}</p></div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#344b69] bg-[#0d1725]/75 px-6 py-10 text-center"><div className="max-w-sm"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#365079] bg-[#132642] font-mono text-[#82afff]">$</span><h3 className="mt-4 text-base font-black text-[#dce6f5]">Tu primer saldo empieza con una cuenta</h3><p className="mt-2 text-sm leading-6 text-[#7f91ad]">Creá efectivo, banco o billetera y después registrá ingresos y egresos.</p><button type="button" onClick={() => setAccountModalId("new")} className="mt-5 rounded-xl bg-[#82afff] px-4 py-2.5 text-sm font-black text-[#07111f]">Crear primera cuenta</button></div></div>
      )}

      {workspace.financeAccounts.length > 0 ? (
        <section aria-labelledby="finance-due-payments-title" className="overflow-hidden rounded-2xl border border-[#554a32] bg-[linear-gradient(145deg,#151b24,#171a20)]">
          <div className="grid gap-3 border-b border-[#3b382f] px-4 py-4 sm:flex sm:items-end sm:justify-between sm:px-5">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#b99551]">Agenda de vencimientos</p>
              <h3 id="finance-due-payments-title" className="mt-1 text-lg font-black text-[#f3ead8]">Pagos por realizar</h3>
              <p className="mt-1 text-xs leading-5 text-[#8f887a]">Son recordatorios: no modifican el saldo hasta que registres el egreso.</p>
            </div>
            <div className="flex items-center gap-2">
              {workspace.financeDuePaymentCounts.overdue > 0 ? <span className="rounded-lg border border-[#864a3e] bg-[#331b18] px-2.5 py-1 text-xs font-black text-[#ff9d88]">{workspace.financeDuePaymentCounts.overdue} vencidos</span> : null}
              <span className="rounded-lg border border-[#66532d] bg-[#292315] px-2.5 py-1 font-mono text-xs font-black text-[#f4c36a]">{workspace.financeDuePaymentCounts.pending} pendientes</span>
            </div>
          </div>
          {visibleDuePayments.length > 0 ? (
            <div className="divide-y divide-[#34342f]">
              {visibleDuePayments.map((payment) => {
                const account = accountById.get(payment.accountId);
                if (!account) return null;
                const urgency = getFinanceDuePaymentUrgency(payment, workspace.today);
                const urgencyStyle = urgency === "overdue"
                  ? "border-[#864a3e] bg-[#331b18] text-[#ff9d88]"
                  : urgency === "today"
                    ? "border-[#9b7135] bg-[#382a14] text-[#ffd17c]"
                    : urgency === "paid"
                      ? "border-[#366c58] bg-[#142c25] text-[#75dcb1]"
                      : "border-[#66532d] bg-[#292315] text-[#f4c36a]";
                const urgencyLabel = urgency === "overdue"
                  ? "Vencido"
                  : urgency === "today"
                    ? "Vence hoy"
                    : urgency === "paid"
                      ? "Pagado"
                      : `Vence ${payment.dueDate.split("-").reverse().join("/")}`;

                return (
                  <article key={payment.id} className={`grid gap-3 px-4 py-4 transition hover:bg-[#202129] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5 ${urgency === "paid" ? "opacity-65" : ""}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${urgencyStyle}`}>{urgencyLabel}</span>
                        {payment.category ? <span className="text-xs font-semibold text-[#8f887a]">{payment.category}</span> : null}
                      </div>
                      <p className={`mt-2 truncate text-sm font-black text-[#f1eadc] ${urgency === "paid" ? "line-through" : ""}`}>{payment.description}</p>
                      <p className="mt-1 truncate text-xs text-[#8f887a]">{account.name} · {payment.dueDate.split("-").reverse().join("/")}</p>
                    </div>
                    <p className={`font-mono text-base font-black ${urgency === "overdue" ? "text-[#ff9d88]" : "text-[#f3ead8]"}`}>{formatMoney(payment.amountMinor, account.currency)}</p>
                    <div className="flex flex-wrap gap-1 sm:justify-end">
                      <button type="button" onClick={() => workspace.setFinanceDuePaymentState(payment.id, payment.status === "paid" ? "pending" : "paid")} className={`rounded-lg border px-2.5 py-1.5 text-xs font-black transition ${payment.status === "paid" ? "border-[#4b5c71] text-[#b8c5d9] hover:bg-[#192b43]" : "border-[#366c58] text-[#75dcb1] hover:bg-[#142c25]"}`}>{payment.status === "paid" ? "Volver a pendiente" : "Marcar pagado"}</button>
                      <button type="button" onClick={() => setDuePaymentModalId(payment.id)} className="rounded-lg border border-[#4b4b46] px-2.5 py-1.5 text-xs font-bold text-[#c1b8a8] transition hover:bg-[#292923]">Editar</button>
                      <button type="button" onClick={() => confirmDuePaymentDelete(payment)} className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-bold text-[#d98276] transition hover:border-[#713d3a] hover:bg-[#2e1716]">Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-9 text-center">
              <p className="text-sm text-[#9a9386]">{normalizedQuery ? "No hay pagos que coincidan con la búsqueda." : "Todavía no tenés pagos pendientes cargados."}</p>
              {!normalizedQuery ? <button type="button" onClick={() => setDuePaymentModalId("new")} className="mt-4 rounded-xl border border-[#7d6330] bg-[#2c2415] px-4 py-2.5 text-sm font-black text-[#f4c36a] transition hover:bg-[#3a2e19]">Anotar un pago</button> : null}
            </div>
          )}
        </section>
      ) : null}

      {workspace.financeAccounts.length > 0 ? (
        <section aria-labelledby="finance-accounts-title">
          <div className="mb-3 flex items-center justify-between"><h3 id="finance-accounts-title" className="text-lg font-black text-[#edf3fb]">Cuentas</h3><span className="font-mono text-xs text-[#7185a3]">{workspace.financeAccounts.length}</span></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {workspace.financeAccounts.map((account) => {
              const balance = workspace.financeBalances.get(account.id) ?? account.openingBalanceMinor;
              const count = workspace.financeEntries.filter((entry) => entry.accountId === account.id).length;
              return (
                <button key={account.id} type="button" onClick={() => setAccountModalId(account.id)} className="group min-w-0 rounded-2xl border border-[#2d4565] bg-[#101e30] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#4a6b96] hover:bg-[#14253a]">
                  <div className="flex items-start justify-between gap-3"><span className="rounded-lg border border-[#355274] bg-[#0a1725] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#8fa4c0]">{getFinanceAccountTypeLabel(account.type)}</span><span className="font-mono text-xs font-black text-[#82afff]">{account.currency}</span></div>
                  <h4 className="mt-5 truncate text-base font-black text-[#e9f0fa]">{account.name}</h4>
                  <p className={`mt-1 font-mono text-2xl font-black ${balance < 0 ? "text-[#ff927d]" : "text-[#edf3fb]"}`}>{formatMoney(balance, account.currency)}</p>
                  <p className="mt-4 text-xs font-semibold text-[#7185a3]">{count} {count === 1 ? "movimiento" : "movimientos"} · Editar cuenta</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {workspace.financeAccounts.length > 0 ? (
        <section aria-labelledby="finance-entries-title" className="overflow-hidden rounded-2xl border border-[#2d4565] bg-[#0d1928]">
          <div className="flex items-center justify-between border-b border-[#263b57] px-4 py-4 sm:px-5"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7185a3]">Cronología</p><h3 id="finance-entries-title" className="mt-1 text-lg font-black text-[#edf3fb]">Movimientos recientes</h3></div><span className="font-mono text-xs text-[#7185a3]">{visibleEntries.length}</span></div>
          {visibleEntries.length > 0 ? (
            <div className="divide-y divide-[#213650]">
              {visibleEntries.map((entry) => {
                const account = accountById.get(entry.accountId);
                if (!account) return null;
                return (
                  <article key={entry.id} className="grid gap-3 px-4 py-4 transition hover:bg-[#122238] sm:grid-cols-[96px_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5">
                    <time className="font-mono text-xs font-bold text-[#8292ad]">{entry.date.split("-").reverse().join("/")}</time>
                    <div className="min-w-0"><p className="truncate text-sm font-black text-[#e7eef9]">{entry.description}</p><p className="mt-1 truncate text-xs text-[#7185a3]">{account.name}{entry.category ? ` · ${entry.category}` : ""}</p></div>
                    <p className={`font-mono text-sm font-black ${entry.kind === "income" ? "text-[#63d3a5]" : "text-[#ff927d]"}`}>{entry.kind === "income" ? "+" : "−"} {formatMoney(entry.amountMinor, account.currency)}</p>
                    <div className="flex gap-1 sm:justify-end"><button type="button" onClick={() => setEntryModal({ id: entry.id, kind: entry.kind })} className="rounded-lg border border-[#334b6d] px-2.5 py-1.5 text-xs font-bold text-[#aebdd1] transition hover:bg-[#192b43]">Editar</button><button type="button" onClick={() => confirmEntryDelete(entry)} className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-bold text-[#d98276] transition hover:border-[#713d3a] hover:bg-[#2e1716]">Eliminar</button></div>
                  </article>
                );
              })}
            </div>
          ) : <p className="px-5 py-10 text-center text-sm text-[#7f91ad]">{normalizedQuery ? "No hay movimientos que coincidan con la búsqueda." : "Todavía no registraste movimientos."}</p>}
        </section>
      ) : null}

      {accountModalId ? (
        <FinanceModal eyebrow={selectedAccount ? "Editar cuenta" : "Nueva cuenta"} title={selectedAccount?.name ?? "Crear cuenta"} onClose={() => setAccountModalId(null)}>
          <AccountForm
            key={selectedAccount?.id ?? "new-account"}
            account={selectedAccount}
            entryCount={selectedAccount ? workspace.financeEntries.filter((entry) => entry.accountId === selectedAccount.id).length : 0}
            onSave={(draft) => selectedAccount ? workspace.updateFinanceAccount(selectedAccount.id, draft) : workspace.addFinanceAccount(draft)}
            onDelete={selectedAccount ? () => confirmAccountDelete(selectedAccount) : undefined}
            onClose={() => setAccountModalId(null)}
          />
        </FinanceModal>
      ) : null}

      {entryModal ? (
        <FinanceModal eyebrow={selectedEntry ? "Editar movimiento" : "Nuevo movimiento"} title={selectedEntry?.description ?? (entryModal.kind === "income" ? "Registrar ingreso" : "Registrar egreso")} onClose={() => setEntryModal(null)}>
          <EntryForm
            key={selectedEntry?.id ?? `new-${entryModal.kind}`}
            entry={selectedEntry}
            accounts={workspace.financeAccounts}
            today={workspace.today}
            defaultKind={entryModal.kind}
            onSave={(draft) => selectedEntry ? workspace.updateFinanceEntry(selectedEntry.id, draft) : workspace.addFinanceEntry(draft)}
            onClose={() => setEntryModal(null)}
          />
        </FinanceModal>
      ) : null}

      {duePaymentModalId ? (
        <FinanceModal eyebrow={selectedDuePayment ? "Editar vencimiento" : "Nuevo vencimiento"} title={selectedDuePayment?.description ?? "Anotar pago pendiente"} onClose={() => setDuePaymentModalId(null)}>
          <DuePaymentForm
            key={selectedDuePayment?.id ?? "new-due-payment"}
            payment={selectedDuePayment}
            accounts={workspace.financeAccounts}
            today={workspace.today}
            onSave={(draft) => selectedDuePayment ? workspace.updateFinanceDuePayment(selectedDuePayment.id, draft) : workspace.addFinanceDuePayment(draft)}
            onClose={() => setDuePaymentModalId(null)}
          />
        </FinanceModal>
      ) : null}
    </div>
  );
}

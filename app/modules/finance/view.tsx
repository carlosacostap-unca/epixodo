"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import ui from "../../components/workspace-screen.module.css";
import styles from "./finance.module.css";
import { paymentExpenseId, type FinanceWorkspace } from "./workspace";
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
} from "../../lib/finance";

const financeControlClass = `${ui.control} w-full px-3`;
const primaryButtonClass = `${ui.button} ${ui.primary}`;
const dangerButtonClass = `${ui.button} ${ui.danger}`;
const statusClass = "w-fit rounded-md border px-2 py-1 text-xs font-semibold";
const paymentStatus = {
  overdue: { label: "Vencido", style: "border-[#864a3e] bg-[#331b18] text-(--finance-expense)" },
  today: { label: "Vence hoy", style: "border-[#8a682f] bg-[#382a14] text-[#ffd17c]" },
  paid: { label: "Pagado", style: "border-[#366c58] bg-[#142c25] text-(--finance-income)" },
  upcoming: { label: "Pendiente", style: "border-(--workspace-control-border) bg-(--workspace-inset) text-(--workspace-muted)" },
};

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
    <label className={ui.label}>
      {label}
      {children}
      {hint ? <span className="text-xs font-normal">{hint}</span> : null}
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose(); }} className={`${ui.dialog} m-auto w-[calc(100%-2rem)] max-w-xl border shadow-2xl backdrop:bg-[#050812]/75`} aria-labelledby={titleId}>
        <div className="flex items-center justify-between gap-4 border-b border-(--workspace-border) px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-(--accent)">{eyebrow}</p>
            <h2 id={titleId} className={`${ui.panelTitle} mt-1 wrap-anywhere`}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={`${ui.button} ${ui.iconButton} shrink-0`}>×</button>
        </div>
        {children}
    </dialog>
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
      {error ? <p role="alert" className="rounded-lg border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm text-(--finance-expense)">{error}</p> : null}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-(--workspace-border) pt-4">
        {onDelete ? <button type="button" onClick={onDelete} className={`${dangerButtonClass} mr-auto`}>Eliminar cuenta</button> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onClose} className={ui.button}>Cancelar</button>
          <button type="submit" className={primaryButtonClass}>Guardar cuenta</button>
        </div>
      </div>
    </form>
  );
}

function EntryForm({
  entry,
  payment,
  accounts,
  today,
  defaultKind,
  onSave,
  onClose,
}: {
  entry: FinanceEntry | null;
  payment?: FinanceDuePayment;
  accounts: FinanceAccount[];
  today: string;
  defaultKind: FinanceEntryKind;
  onSave: (draft: FinanceEntryDraft) => void;
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState(entry?.accountId ?? payment?.accountId ?? accounts[0]?.id ?? "");
  const [kind, setKind] = useState<FinanceEntryKind>(entry?.kind ?? defaultKind);
  const [date, setDate] = useState(entry?.date ?? today);
  const [description, setDescription] = useState(entry?.description ?? payment?.description ?? "");
  const initialAmount = entry?.amountMinor ?? payment?.amountMinor;
  const [amount, setAmount] = useState(initialAmount === undefined ? "" : minorAmountToInput(initialAmount));
  const [category, setCategory] = useState(entry?.category ?? payment?.category ?? "");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = parseMinorAmount(amount);

    if (!accounts.some((account) => account.id === accountId)) {
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
        {!payment ? <div role="group" aria-label="Tipo de movimiento" className="grid w-fit grid-cols-2 gap-1 border-b border-(--workspace-border)">
        {(["expense", "income"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={`${ui.tab} justify-center`}>
            {value === "income" ? "Ingreso" : "Egreso"}
          </button>
        ))}
      </div> : null}
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
      {error ? <p role="alert" className="rounded-lg border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm text-(--finance-expense)">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2 border-t border-(--workspace-border) pt-4">
        <button type="button" onClick={onClose} className={ui.button}>Cancelar</button>
        <button type="submit" className={primaryButtonClass}>Guardar {kind === "income" ? "ingreso" : "egreso"}</button>
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
  const [accountId, setAccountId] = useState(payment?.accountId ?? "");
  const [currency, setCurrency] = useState(payment?.currency ?? "ARS");
  const [description, setDescription] = useState(payment?.description ?? "");
  const [amount, setAmount] = useState(payment ? minorAmountToInput(payment.amountMinor) : "");
  const [dueDate, setDueDate] = useState(payment?.dueDate ?? today);
  const [category, setCategory] = useState(payment?.category ?? "");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = parseMinorAmount(amount);
    const normalizedCurrency = currency.trim().toUpperCase();

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
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError("La moneda debe tener tres letras, por ejemplo ARS o USD.");
      return;
    }

    onSave({
      accountId: accountId || null,
      description: description.trim(),
      amountMinor,
      currency: normalizedCurrency,
      dueDate,
      category: category.trim(),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
        <FinanceField label="Cuenta" hint="Opcional: podés decidir desde dónde pagar más adelante.">
          <select
            value={accountId}
            onChange={(event) => {
              const nextAccountId = event.target.value;
              setAccountId(nextAccountId);
              const account = accounts.find((item) => item.id === nextAccountId);
              if (account) setCurrency(account.currency);
            }}
            className={financeControlClass}
          >
            <option value="">Sin cuenta definida</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}
          </select>
        </FinanceField>
        <FinanceField label="Moneda" hint={accountId ? "Definida por la cuenta." : "Código de tres letras."}>
          <input value={currency} disabled={Boolean(accountId)} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} className={`${financeControlClass} font-mono uppercase`} />
        </FinanceField>
      </div>
      <FinanceField label="Descripción">
        <input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Obra social, impuesto, servicio, tarjeta…" className={financeControlClass} />
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
      {error ? <p role="alert" className="rounded-lg border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm text-(--finance-expense)">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2 border-t border-(--workspace-border) pt-4">
        <button type="button" onClick={onClose} className={ui.button}>Cancelar</button>
        <button type="submit" className={primaryButtonClass}>Guardar pago</button>
      </div>
    </form>
  );
}

export default function FinanceView({
  finance,
  searchQuery,
}: {
  finance: FinanceWorkspace;
  searchQuery: string;
}) {
  const [accountModalId, setAccountModalId] = useState<string | "new" | null>(null);
  const [entryModal, setEntryModal] = useState<{ id: string | null; kind: FinanceEntryKind; payment?: FinanceDuePayment } | null>(null);
  const [duePaymentModalId, setDuePaymentModalId] = useState<string | "new" | null>(null);
  const selectedAccount = accountModalId && accountModalId !== "new"
    ? finance.accounts.find((account) => account.id === accountModalId) ?? null
    : null;
  const selectedEntry = entryModal?.id
    ? finance.entries.find((entry) => entry.id === entryModal.id) ?? null
    : null;
  const selectedDuePayment = duePaymentModalId && duePaymentModalId !== "new"
    ? finance.duePayments.find((payment) => payment.id === duePaymentModalId) ?? null
    : null;
  const { accountById } = finance;
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("es");
  const amountTerms = (minor: number, currency: string) =>
    [minorAmountToInput(minor), String(minor / 100), formatMoney(minor, currency)].join(" ");
  const visibleEntries = finance.recentEntries.filter((entry) => {
    if (!normalizedQuery) return true;
    const account = accountById.get(entry.accountId);
    const currency = account?.currency ?? "";
    return `${entry.description} ${entry.category} ${account?.name ?? ""} ${entry.kind} ${entry.kind === "income" ? "ingreso" : "egreso gasto"} ${currency} ${entry.date} ${amountTerms(entry.amountMinor, currency || "ARS")}`
      .toLocaleLowerCase("es")
      .includes(normalizedQuery);
  });
  const visibleDuePayments = finance.orderedDuePayments.filter((payment) => {
    if (!normalizedQuery) return true;
    const account = payment.accountId ? accountById.get(payment.accountId) : null;
    return `${payment.description} ${payment.category} ${payment.currency} ${account?.name ?? "sin cuenta"} ${payment.status} ${payment.status === "paid" ? "pagado" : "pendiente"} ${payment.dueDate} ${amountTerms(payment.amountMinor, payment.currency)}`
      .toLocaleLowerCase("es")
      .includes(normalizedQuery);
  });
  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(`${finance.today.slice(0, 7)}-01T12:00:00`),
  );

  function confirmAccountDelete(account: FinanceAccount) {
    const entryCount = finance.entries.filter((entry) => entry.accountId === account.id).length;
    const paymentCount = finance.duePayments.filter((payment) => payment.accountId === account.id).length;
    if (window.confirm(`Eliminar “${account.name}” también eliminará ${entryCount} ${entryCount === 1 ? "movimiento" : "movimientos"}. ${paymentCount} ${paymentCount === 1 ? "pago programado quedará" : "pagos programados quedarán"} sin cuenta asociada. Esta acción no se puede deshacer.`)) {
      finance.deleteAccount(account.id);
      setAccountModalId(null);
    }
  }

  function confirmEntryDelete(entry: FinanceEntry) {
    if (window.confirm(`¿Eliminar el movimiento “${entry.description}”? El saldo se recalculará.`)) {
      finance.deleteEntry(entry.id);
    }
  }

  function confirmDuePaymentDelete(payment: FinanceDuePayment) {
    if (window.confirm(`¿Eliminar el pago “${payment.description}”? Esta acción no se puede deshacer.`)) {
      finance.deleteDuePayment(payment.id);
    }
  }

  return (
    <div className="space-y-5">
      <div role="group" aria-label="Registrar en Finanzas" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button type="button" onClick={() => setAccountModalId("new")} className={ui.button}>+ Cuenta</button>
        <button type="button" onClick={() => setDuePaymentModalId("new")} className={ui.button}>+ Pago pendiente</button>
        <button type="button" disabled={finance.accounts.length === 0} onClick={() => setEntryModal({ id: null, kind: "expense" })} className={ui.button}>− Egreso</button>
        <button type="button" disabled={finance.accounts.length === 0} onClick={() => setEntryModal({ id: null, kind: "income" })} className={ui.button}>+ Ingreso</button>
      </div>

      {finance.summaries.length > 0 ? (
        <section aria-labelledby="finance-summary-title" className={ui.panel}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-(--workspace-border) p-4 sm:px-5">
            <h2 id="finance-summary-title" className={ui.panelTitle}>Saldos por moneda</h2>
            <p className="text-sm text-(--workspace-muted) first-letter:uppercase">{monthLabel}</p>
          </div>
          <div className="divide-y divide-(--workspace-border)">
            {finance.summaries.map((summary) => (
              <div key={summary.currency} className="grid items-start gap-3 px-4 py-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-5 sm:px-5">
                <span className="w-fit rounded-md bg-(--workspace-selection) px-2 py-1 font-mono text-sm font-semibold text-(--accent)">{summary.currency}</span>
                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
                  <div className="col-span-2 min-w-0 lg:col-span-1">
                    <dt className="text-sm text-(--workspace-muted)">Saldo actual</dt>
                    <dd className="mt-1 wrap-anywhere font-mono text-2xl font-semibold tabular-nums">{formatMoney(summary.balanceMinor, summary.currency)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-sm text-(--workspace-muted)">Ingresos del mes</dt>
                    <dd className="mt-1 wrap-anywhere font-mono text-base font-medium text-(--finance-income) tabular-nums">+ {formatMoney(summary.incomeMinor, summary.currency)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-sm text-(--workspace-muted)">Egresos del mes</dt>
                    <dd className="mt-1 wrap-anywhere font-mono text-base font-medium text-(--finance-expense) tabular-nums">− {formatMoney(summary.expenseMinor, summary.currency)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className={`${ui.panel} grid min-h-52 place-items-center px-6 py-8 text-center`}>
          <div className="max-w-sm">
            <h2 className={ui.panelTitle}>Tu primer saldo empieza con una cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-(--workspace-muted)">Creá efectivo, banco o billetera y después registrá ingresos y egresos.</p>
            <button type="button" onClick={() => setAccountModalId("new")} className={`${primaryButtonClass} mt-4`}>Crear primera cuenta</button>
          </div>
        </div>
      )}

      <section aria-labelledby="finance-due-payments-title" className={ui.panel}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--workspace-border) p-4 sm:px-5">
            <div>
              <h2 id="finance-due-payments-title" className={`${ui.panelTitle} scroll-mt-24`}>Vencimientos</h2>
              <p className="mt-1 text-sm text-(--workspace-muted)">Registrá el egreso para descontar el pago del saldo.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {finance.duePaymentCounts.overdue > 0 ? <span className={`${statusClass} ${paymentStatus.overdue.style}`}>{finance.duePaymentCounts.overdue} {finance.duePaymentCounts.overdue === 1 ? "vencido" : "vencidos"}</span> : null}
              <span className={`${statusClass} ${paymentStatus.upcoming.style}`}>{finance.duePaymentCounts.pending} {finance.duePaymentCounts.pending === 1 ? "pendiente" : "pendientes"}</span>
            </div>
          </div>
          {visibleDuePayments.length > 0 ? (
            <div className="divide-y divide-(--workspace-border)">
              {visibleDuePayments.map((payment) => {
                const account = payment.accountId ? accountById.get(payment.accountId) : null;
                const expenseId = finance.entries.find((entry) => entry.id === paymentExpenseId(payment.id))?.id;
                const hasCompatibleAccount = finance.accounts.some((item) => item.currency === payment.currency);
                const status = paymentStatus[getFinanceDuePaymentUrgency(payment, finance.today)];

                return (
                  <article key={payment.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)] sm:items-start sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,auto)] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`${statusClass} ${status.style}`}>{status.label}</span>
                        {payment.category ? <span className="wrap-anywhere text-xs text-(--workspace-muted)">{payment.category}</span> : null}
                      </div>
                      <p className="mt-2 wrap-anywhere text-sm font-semibold">{payment.description}</p>
                      <p className="mt-1 wrap-anywhere text-xs text-(--workspace-muted)">{account?.name ?? "Sin cuenta definida"} · <time dateTime={payment.dueDate}>{payment.dueDate.split("-").reverse().join("/")}</time></p>
                    </div>
                    <p className="wrap-anywhere font-mono text-base font-semibold tabular-nums sm:text-right">{formatMoney(payment.amountMinor, payment.currency)}</p>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
                      {payment.status === "paid" && (hasCompatibleAccount || expenseId) ? (
                        <button type="button" className={expenseId ? ui.button : primaryButtonClass} onClick={() => setEntryModal({ id: expenseId ?? null, kind: "expense", payment })}>
                          {expenseId ? "Ver egreso" : "Registrar egreso"}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => finance.setDuePaymentStatus(payment.id, payment.status === "paid" ? "pending" : "paid")} className={ui.button}>{payment.status === "paid" ? "Volver a pendiente" : "Marcar pagado"}</button>
                      <button type="button" onClick={() => setDuePaymentModalId(payment.id)} className={ui.button}>Editar</button>
                      <button type="button" onClick={() => confirmDuePaymentDelete(payment)} className={dangerButtonClass}>Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-9 text-center">
              <p className="text-sm text-(--workspace-muted)">{normalizedQuery ? "No hay pagos que coincidan con la búsqueda." : "Todavía no tenés pagos pendientes cargados."}</p>
              {!normalizedQuery ? <button type="button" onClick={() => setDuePaymentModalId("new")} className={`${ui.button} mt-4`}>Anotar un pago</button> : null}
            </div>
          )}
      </section>

      {finance.accounts.length > 0 ? (
        <section aria-labelledby="finance-accounts-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="finance-accounts-title" className={ui.panelTitle}>Cuentas</h2>
            <span className="font-mono text-xs text-(--workspace-muted)">{finance.accounts.length}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {finance.accounts.map((account) => {
              const balance = finance.balances.get(account.id) ?? account.openingBalanceMinor;
              const count = finance.entries.filter((entry) => entry.accountId === account.id).length;
              return (
                <button key={account.id} type="button" onClick={() => setAccountModalId(account.id)} className={`${ui.panel} ${styles.account} grid gap-2 p-4 text-left`}>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="wrap-anywhere text-base font-semibold">{account.name}</span>
                    <span className="font-mono text-xs font-semibold text-(--accent)">{account.currency}</span>
                  </span>
                  <span className="text-xs text-(--workspace-muted)">{getFinanceAccountTypeLabel(account.type)}</span>
                  <span className={`wrap-anywhere font-mono text-xl font-semibold tabular-nums ${balance < 0 ? "text-(--finance-expense)" : ""}`}>{formatMoney(balance, account.currency)}</span>
                  <span className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-(--workspace-muted)">
                    <span>{count} {count === 1 ? "movimiento" : "movimientos"}</span>
                    <span className="font-semibold text-(--accent) underline underline-offset-2">Editar cuenta</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {finance.accounts.length > 0 ? (
        <section aria-labelledby="finance-entries-title" className={ui.panel}>
          <div className="flex items-center justify-between gap-3 border-b border-(--workspace-border) p-4 sm:px-5">
            <h2 id="finance-entries-title" className={`${ui.panelTitle} scroll-mt-24`}>Movimientos recientes</h2>
            <span className="font-mono text-xs text-(--workspace-muted)">{visibleEntries.length}</span>
          </div>
          {visibleEntries.length > 0 ? (
            <div className="divide-y divide-(--workspace-border)">
              {visibleEntries.map((entry) => {
                const account = accountById.get(entry.accountId);
                if (!account) return null;
                return (
                  <article key={entry.id} className="grid gap-2 p-4 sm:px-5 md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,auto)_auto] md:items-center md:gap-3">
                    <time dateTime={entry.date} className="font-mono text-xs text-(--workspace-muted)">{entry.date.split("-").reverse().join("/")}</time>
                    <div className="min-w-0">
                      <p className="wrap-anywhere text-sm font-semibold">{entry.description}</p>
                      <p className="mt-1 wrap-anywhere text-xs text-(--workspace-muted)">{account.name}{entry.category ? ` · ${entry.category}` : ""}</p>
                    </div>
                    <p className={`wrap-anywhere font-mono text-sm font-semibold tabular-nums md:text-right ${entry.kind === "income" ? "text-(--finance-income)" : "text-(--finance-expense)"}`}>{entry.kind === "income" ? "+" : "−"} {formatMoney(entry.amountMinor, account.currency)}</p>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button type="button" onClick={() => setEntryModal({ id: entry.id, kind: entry.kind })} className={ui.button}>Editar</button>
                      <button type="button" onClick={() => confirmEntryDelete(entry)} className={dangerButtonClass}>Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <p className="px-5 py-9 text-center text-sm text-(--workspace-muted)">{normalizedQuery ? "No hay movimientos que coincidan con la búsqueda." : "Todavía no registraste movimientos."}</p>}
        </section>
      ) : null}

      {accountModalId ? (
        <FinanceModal eyebrow={selectedAccount ? "Editar cuenta" : "Nueva cuenta"} title={selectedAccount?.name ?? "Crear cuenta"} onClose={() => setAccountModalId(null)}>
          <AccountForm
            key={selectedAccount?.id ?? "new-account"}
            account={selectedAccount}
            entryCount={selectedAccount ? finance.entries.filter((entry) => entry.accountId === selectedAccount.id).length : 0}
            onSave={(draft) => selectedAccount ? finance.updateAccount(selectedAccount.id, draft) : finance.addAccount(draft)}
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
            payment={entryModal.payment}
            accounts={entryModal.payment ? finance.accounts.filter(({ currency }) => currency === entryModal.payment?.currency) : finance.accounts}
            today={finance.today}
            defaultKind={entryModal.kind}
            onSave={(draft) => selectedEntry ? finance.updateEntry(selectedEntry.id, draft) : finance.addEntry(draft, entryModal.payment?.id)}
            onClose={() => setEntryModal(null)}
          />
        </FinanceModal>
      ) : null}

      {duePaymentModalId ? (
        <FinanceModal eyebrow={selectedDuePayment ? "Editar vencimiento" : "Nuevo vencimiento"} title={selectedDuePayment?.description ?? "Anotar pago pendiente"} onClose={() => setDuePaymentModalId(null)}>
          <DuePaymentForm
            key={selectedDuePayment?.id ?? "new-due-payment"}
            payment={selectedDuePayment}
            accounts={finance.accounts}
            today={finance.today}
            onSave={(draft) => selectedDuePayment ? finance.updateDuePayment(selectedDuePayment.id, draft) : finance.addDuePayment(draft)}
            onClose={() => setDuePaymentModalId(null)}
          />
        </FinanceModal>
      ) : null}
    </div>
  );
}

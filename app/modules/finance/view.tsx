"use client";

import { FormEvent, useState } from "react";
import type { FinanceWorkspace } from "./workspace";
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

const financeControlClass =
  "h-11 w-full rounded-xl border border-[#324968] bg-[#091522] px-3 text-sm text-[#e8eef8] outline-none transition placeholder:text-[#61708d] focus:border-[#d8bdf9] focus:ring-2 focus:ring-[#d8bdf9]/15";

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
    <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#bba9ce]">
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
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#355071] bg-[#201a2e] shadow-[0_30px_100px_rgba(0,0,0,0.52)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#41374f] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#d8bdf9]">{eyebrow}</p>
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#41374f] pt-4">
        {onDelete ? <button type="button" onClick={onDelete} className="rounded-xl border border-[#713d3a] px-4 py-2.5 text-sm font-bold text-[#ff9d88] transition hover:bg-[#2e1716]">Eliminar cuenta</button> : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#344c6d] px-4 py-2.5 text-sm font-bold text-[#b8c5d9] transition hover:bg-[#17283e]">Cancelar</button>
          <button type="submit" className="rounded-xl bg-[#d8bdf9] px-4 py-2.5 text-sm font-black text-[#07111f] transition hover:bg-[#a8c7ff]">Guardar cuenta</button>
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
      <div className="flex justify-end gap-2 border-t border-[#41374f] pt-4">
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
      {error ? <p role="alert" className="rounded-xl border border-[#7a3d32] bg-[#2e1716] px-3 py-2 text-sm font-semibold text-[#ff9d88]">{error}</p> : null}
      <div className="flex justify-end gap-2 border-t border-[#41374f] pt-4">
        <button type="button" onClick={onClose} className="rounded-xl border border-[#344c6d] px-4 py-2.5 text-sm font-bold text-[#b8c5d9] transition hover:bg-[#17283e]">Cancelar</button>
        <button type="submit" className="rounded-xl bg-[#f4c36a] px-4 py-2.5 text-sm font-black text-[#281b05] transition hover:bg-[#ffda8c]">Guardar pago</button>
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
  const [entryModal, setEntryModal] = useState<{ id: string | null; kind: FinanceEntryKind } | null>(null);
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
  const visibleEntries = finance.recentEntries.filter((entry) => {
    if (!normalizedQuery) return true;
    const account = accountById.get(entry.accountId);
    return `${entry.description} ${entry.category} ${account?.name ?? ""} ${entry.kind}`
      .toLocaleLowerCase("es")
      .includes(normalizedQuery);
  });
  const visibleDuePayments = finance.orderedDuePayments.filter((payment) => {
    if (!normalizedQuery) return true;
    const account = payment.accountId ? accountById.get(payment.accountId) : null;
    return `${payment.description} ${payment.category} ${payment.currency} ${account?.name ?? "sin cuenta"} ${payment.status}`
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
    <div className="space-y-6">
      <div role="group" aria-label="Registrar en Finanzas" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button type="button" onClick={() => setAccountModalId("new")} className="rounded-xl border border-[#6e587f] px-4 py-2.5 text-sm font-bold text-[#ded3e9] transition hover:bg-[#342742]">+ Cuenta</button>
          <button type="button" onClick={() => setDuePaymentModalId("new")} className="rounded-xl border border-[#7d6330] bg-[#2c2415] px-4 py-2.5 text-sm font-black text-[#f4c36a] transition hover:-translate-y-0.5 hover:bg-[#3a2e19]">+ Pago pendiente</button>
          <button type="button" disabled={finance.accounts.length === 0} onClick={() => setEntryModal({ id: null, kind: "expense" })} className="rounded-xl border border-[#ff927d] bg-[#ff927d] px-4 py-2.5 text-sm font-black text-[#28100d] transition hover:-translate-y-0.5 hover:bg-[#ffb09f]">− Egreso</button>
          <button type="button" disabled={finance.accounts.length === 0} onClick={() => setEntryModal({ id: null, kind: "income" })} className="rounded-xl border border-[#63d3a5] bg-[#63d3a5] px-4 py-2.5 text-sm font-black text-[#071b14] transition hover:-translate-y-0.5 hover:bg-[#8ce3bf]">+ Ingreso</button>
      </div>

      {finance.summaries.length > 0 ? (
        <section aria-labelledby="finance-summary-title" className="overflow-hidden rounded-sm border border-[#514461] border-t-4 border-t-[#d8bdf9] bg-[#1c1828]">
          <div className="grid gap-3 border-b border-[#41374f] px-4 py-4 sm:flex sm:items-end sm:justify-between sm:px-5">
            <h2 id="finance-summary-title" className="font-serif text-2xl tracking-tight text-[#f3eefb]">Saldos por moneda</h2>
            <p className="font-mono text-xs text-[#aba0bc] first-letter:uppercase">{monthLabel}</p>
          </div>
          <div className="divide-y divide-[#41374f]">
            {finance.summaries.map((summary) => (
              <div key={summary.currency} className="grid grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-[72px_repeat(3,minmax(0,1fr))] sm:items-end sm:px-5">
                <span className="w-fit self-start rounded-lg border border-[#625177] bg-[#302642] px-2.5 py-1 font-mono text-xs font-black tracking-[0.12em] text-[#e1d1fa]">{summary.currency}</span>
                <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#aba0bc]">Saldo actual</p><p className="mt-1 font-mono text-xl font-black text-[#f3eefb]">{formatMoney(summary.balanceMinor, summary.currency)}</p></div>
                <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#4fae88]">Ingresos del mes</p><p className="mt-1 font-mono text-lg font-black text-[#63d3a5]">+ {formatMoney(summary.incomeMinor, summary.currency)}</p></div>
                <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d57565]">Egresos del mes</p><p className="mt-1 font-mono text-lg font-black text-[#ff927d]">− {formatMoney(summary.expenseMinor, summary.currency)}</p></div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#584a6c] bg-[#231c30]/75 px-6 py-10 text-center"><div className="max-w-sm"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#65547b] bg-[#352744] font-mono text-[#d8bdf9]">$</span><h3 className="mt-4 text-base font-black text-[#eee4f7]">Tu primer saldo empieza con una cuenta</h3><p className="mt-2 text-sm leading-6 text-[#b2a5c6]">Creá efectivo, banco o billetera y después registrá ingresos y egresos.</p><button type="button" onClick={() => setAccountModalId("new")} className="mt-5 rounded-xl bg-[#d8bdf9] px-4 py-2.5 text-sm font-black text-[#07111f]">Crear primera cuenta</button></div></div>
      )}

      <section aria-labelledby="finance-due-payments-title" className="overflow-hidden rounded-sm border border-[#554a32] bg-[linear-gradient(145deg,#231c2a,#231c28)]">
          <div className="grid gap-3 border-b border-[#514135] px-4 py-4 sm:flex sm:items-end sm:justify-between sm:px-5">
            <div>
              <h2 id="finance-due-payments-title" className="font-serif text-2xl tracking-tight text-[#f3ead8]">Vencimientos</h2>
              <p className="mt-1 text-xs leading-5 text-[#baab98]">Registrá el egreso para descontar el pago del saldo.</p>
            </div>
            <div className="flex items-center gap-2">
              {finance.duePaymentCounts.overdue > 0 ? <span className="rounded-lg border border-[#864a3e] bg-[#331b18] px-2.5 py-1 text-xs font-black text-[#ff9d88]">{finance.duePaymentCounts.overdue} {finance.duePaymentCounts.overdue === 1 ? "vencido" : "vencidos"}</span> : null}
              <span className="rounded-lg border border-[#66532d] bg-[#292315] px-2.5 py-1 font-mono text-xs font-black text-[#f4c36a]">{finance.duePaymentCounts.pending} {finance.duePaymentCounts.pending === 1 ? "pendiente" : "pendientes"}</span>
            </div>
          </div>
          {visibleDuePayments.length > 0 ? (
            <div className="divide-y divide-[#493b36]">
              {visibleDuePayments.map((payment) => {
                const account = payment.accountId ? accountById.get(payment.accountId) : null;
                const urgency = getFinanceDuePaymentUrgency(payment, finance.today);
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
                  <article key={payment.id} className={`grid gap-3 px-4 py-4 transition hover:bg-[#30232d] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5 ${urgency === "paid" ? "opacity-65" : ""}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${urgencyStyle}`}>{urgencyLabel}</span>
                        {payment.category ? <span className="text-xs font-semibold text-[#baab98]">{payment.category}</span> : null}
                      </div>
                      <p className={`mt-2 truncate text-sm font-black text-[#f1eadc] ${urgency === "paid" ? "line-through" : ""}`}>{payment.description}</p>
                      <p className="mt-1 truncate text-xs text-[#baab98]">{account?.name ?? "Sin cuenta definida"} · {payment.dueDate.split("-").reverse().join("/")}</p>
                    </div>
                    <p className={`font-mono text-base font-black ${urgency === "overdue" ? "text-[#ff9d88]" : "text-[#f3ead8]"}`}>{formatMoney(payment.amountMinor, payment.currency)}</p>
                    <div className="flex flex-wrap gap-1 sm:justify-end">
                      <button type="button" onClick={() => finance.setDuePaymentStatus(payment.id, payment.status === "paid" ? "pending" : "paid")} className={`rounded-lg border px-2.5 py-1.5 text-xs font-black transition ${payment.status === "paid" ? "border-[#4b5c71] text-[#b8c5d9] hover:bg-[#332743]" : "border-[#366c58] text-[#75dcb1] hover:bg-[#142c25]"}`}>{payment.status === "paid" ? "Volver a pendiente" : "Marcar pagado"}</button>
                      <button type="button" onClick={() => setDuePaymentModalId(payment.id)} className="rounded-lg border border-[#4b4b46] px-2.5 py-1.5 text-xs font-bold text-[#c1b8a8] transition hover:bg-[#292923]">Editar</button>
                      <button type="button" onClick={() => confirmDuePaymentDelete(payment)} className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-bold text-[#d98276] transition hover:border-[#713d3a] hover:bg-[#2e1716]">Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-9 text-center">
              <p className="text-sm text-[#b8a997]">{normalizedQuery ? "No hay pagos que coincidan con la búsqueda." : "Todavía no tenés pagos pendientes cargados."}</p>
              {!normalizedQuery ? <button type="button" onClick={() => setDuePaymentModalId("new")} className="mt-4 rounded-xl border border-[#7d6330] bg-[#2c2415] px-4 py-2.5 text-sm font-black text-[#f4c36a] transition hover:bg-[#3a2e19]">Anotar un pago</button> : null}
            </div>
          )}
      </section>

      {finance.accounts.length > 0 ? (
        <section aria-labelledby="finance-accounts-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="finance-accounts-title" className="font-serif text-2xl tracking-tight text-[#f3eefb]">Cuentas</h2><span className="font-mono text-xs text-[#aba0bc]">{finance.accounts.length}</span></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {finance.accounts.map((account) => {
              const balance = finance.balances.get(account.id) ?? account.openingBalanceMinor;
              const count = finance.entries.filter((entry) => entry.accountId === account.id).length;
              return (
                <button key={account.id} type="button" onClick={() => setAccountModalId(account.id)} className="min-w-0 rounded-sm border border-[#514461] bg-[#251e32] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#7c6597] hover:bg-[#302741]">
                  <div className="flex items-start justify-between gap-3"><span className="rounded-lg border border-[#645375] bg-[#21192e] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#c4b3d8]">{getFinanceAccountTypeLabel(account.type)}</span><span className="font-mono text-xs font-black text-[#d8bdf9]">{account.currency}</span></div>
                  <h4 className="mt-5 truncate text-base font-black text-[#f3eefb]">{account.name}</h4>
                  <p className={`mt-1 font-mono text-2xl font-black ${balance < 0 ? "text-[#ff927d]" : "text-[#f3eefb]"}`}>{formatMoney(balance, account.currency)}</p>
                  <p className="mt-4 text-xs font-semibold text-[#aba0bc]">{count} {count === 1 ? "movimiento" : "movimientos"} · Editar cuenta</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {finance.accounts.length > 0 ? (
        <section aria-labelledby="finance-entries-title" className="overflow-hidden rounded-sm border border-[#514461] bg-[#201a2e]">
          <div className="flex items-center justify-between border-b border-[#41374f] px-4 py-4 sm:px-5"><h2 id="finance-entries-title" className="font-serif text-2xl tracking-tight text-[#f3eefb]">Movimientos recientes</h2><span className="font-mono text-xs text-[#aba0bc]">{visibleEntries.length}</span></div>
          {visibleEntries.length > 0 ? (
            <div className="divide-y divide-[#41374f]">
              {visibleEntries.map((entry) => {
                const account = accountById.get(entry.accountId);
                if (!account) return null;
                return (
                  <article key={entry.id} className="grid gap-3 px-4 py-4 transition hover:bg-[#2a2139] sm:grid-cols-[96px_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5">
                    <time className="font-mono text-xs font-bold text-[#bba9ce]">{entry.date.split("-").reverse().join("/")}</time>
                    <div className="min-w-0"><p className="truncate text-sm font-black text-[#f0e8fc]">{entry.description}</p><p className="mt-1 truncate text-xs text-[#aba0bc]">{account.name}{entry.category ? ` · ${entry.category}` : ""}</p></div>
                    <p className={`font-mono text-sm font-black ${entry.kind === "income" ? "text-[#63d3a5]" : "text-[#ff927d]"}`}>{entry.kind === "income" ? "+" : "−"} {formatMoney(entry.amountMinor, account.currency)}</p>
                    <div className="flex gap-1 sm:justify-end"><button type="button" onClick={() => setEntryModal({ id: entry.id, kind: entry.kind })} className="rounded-lg border border-[#5d4d70] px-2.5 py-1.5 text-xs font-bold text-[#c8bad6] transition hover:bg-[#332743]">Editar</button><button type="button" onClick={() => confirmEntryDelete(entry)} className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-bold text-[#d98276] transition hover:border-[#713d3a] hover:bg-[#2e1716]">Eliminar</button></div>
                  </article>
                );
              })}
            </div>
          ) : <p className="px-5 py-10 text-center text-sm text-[#b2a5c6]">{normalizedQuery ? "No hay movimientos que coincidan con la búsqueda." : "Todavía no registraste movimientos."}</p>}
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
            accounts={finance.accounts}
            today={finance.today}
            defaultKind={entryModal.kind}
            onSave={(draft) => selectedEntry ? finance.updateEntry(selectedEntry.id, draft) : finance.addEntry(draft)}
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

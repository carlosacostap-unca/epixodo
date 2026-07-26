import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleCache = new Map();

function loadTypeScriptModule(filename) {
  const resolved = path.resolve(filename);
  if (moduleCache.has(resolved)) return moduleCache.get(resolved).exports;

  const source = fs.readFileSync(resolved, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: resolved,
  }).outputText;
  const loaded = { exports: {} };
  moduleCache.set(resolved, loaded);

  function localRequire(specifier) {
    if (!specifier.startsWith(".")) return nodeRequire(specifier);
    const base = path.resolve(path.dirname(resolved), specifier);
    return loadTypeScriptModule(path.extname(base) ? base : `${base}.ts`);
  }

  const execute = new Function("require", "module", "exports", "__filename", "__dirname", output);
  execute(localRequire, loaded, loaded.exports, resolved, path.dirname(resolved));
  return loaded.exports;
}

const finance = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "finance.ts"));
const codec = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "workspace-codec.ts"));
const storage = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "task-storage.ts"));

const timestamp = "2026-07-23T12:00:00.000Z";
const account = {
  id: "account-ars",
  name: "Cuenta sueldo",
  type: "bank",
  currency: "ARS",
  openingBalanceMinor: -1000,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const usdAccount = {
  ...account,
  id: "account-usd",
  name: "Ahorros",
  currency: "USD",
  openingBalanceMinor: 10000,
};

function entry(id, accountId, kind, date, amountMinor, description = id) {
  return {
    id,
    accountId,
    kind,
    date,
    description,
    amountMinor,
    category: "Prueba",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function duePayment(
  id,
  accountId,
  dueDate,
  status = "pending",
  paidAt = null,
  amountMinor = 2500,
) {
  return {
    id,
    accountId,
    description: id,
    amountMinor,
    dueDate,
    category: "Servicios",
    status,
    paidAt,
    createdAt: timestamp,
    updatedAt: paidAt ?? timestamp,
  };
}

assert.equal(finance.parseMinorAmount("1.234,56"), null);
assert.equal(finance.parseMinorAmount("123,45"), 12345);
assert.equal(finance.parseMinorAmount("-10.50"), -1050);
assert.equal(finance.parseMinorAmount("0,001"), null);
assert.equal(finance.minorAmountToInput(-1050), "-10,50");
assert.match(finance.formatMoney(12345, "ARS"), /123[.,]45/);

const createdAccount = finance.createFinanceAccount(
  { name: "  Billetera  ", type: "digital_wallet", currency: "ars", openingBalanceMinor: 0 },
  new Date(timestamp),
);
assert.equal(createdAccount.name, "Billetera");
assert.equal(createdAccount.currency, "ARS");
assert.equal(
  finance.createFinanceAccount(
    { name: "", type: "bank", currency: "ARS", openingBalanceMinor: 0 },
    new Date(timestamp),
  ),
  null,
);

const julyIncome = entry("income-july", account.id, "income", "2026-07-10", 5000);
const julyExpense = entry("expense-july", account.id, "expense", "2026-07-20", 2000);
const augustExpense = entry("expense-august", account.id, "expense", "2026-08-01", 500);
const usdIncome = entry("income-usd", usdAccount.id, "income", "2026-07-22", 2500);
const entries = [julyIncome, julyExpense, augustExpense, usdIncome];

assert.equal(finance.getAccountBalanceMinor(account, entries), 1500);
assert.deepEqual(
  finance.sortedFinanceEntries(entries).map((item) => item.id),
  ["expense-august", "income-usd", "expense-july", "income-july"],
);

const summaries = finance.getFinanceCurrencySummaries(
  [account, usdAccount],
  entries,
  "2026-07",
);
assert.deepEqual(summaries, [
  { currency: "ARS", balanceMinor: 1500, incomeMinor: 5000, expenseMinor: 2000 },
  { currency: "USD", balanceMinor: 12500, incomeMinor: 2500, expenseMinor: 0 },
]);

assert.equal(
  finance.patchFinanceAccount(account, { currency: "USD" }, true, new Date(timestamp)),
  null,
);
assert.equal(
  finance.patchFinanceAccount(account, { name: "  Banco diario  " }, true, new Date(timestamp)).name,
  "Banco diario",
);
assert.equal(
  finance.patchFinanceEntry(julyIncome, { amountMinor: 0 }, new Set([account.id]), new Date(timestamp)),
  null,
);

const createdEntry = finance.createFinanceEntry(
  {
    accountId: account.id,
    kind: "expense",
    date: "2026-07-23",
    description: "  Supermercado  ",
    amountMinor: 1234,
    category: "  Comida  ",
  },
  new Set([account.id]),
  new Date(timestamp),
);
assert.equal(createdEntry.description, "Supermercado");
assert.equal(createdEntry.category, "Comida");
assert.equal(
  finance.createFinanceEntry(
    { accountId: "missing", kind: "income", date: "2026-07-23", description: "Pago", amountMinor: 10 },
    new Set([account.id]),
    new Date(timestamp),
  ),
  null,
);

const createdPayment = finance.createFinanceDuePayment(
  {
    accountId: account.id,
    description: "  Electricidad  ",
    amountMinor: 4321,
    dueDate: "2026-07-27",
    category: "  Servicios  ",
  },
  new Set([account.id]),
  new Date(timestamp),
);
assert.equal(createdPayment.description, "Electricidad");
assert.equal(createdPayment.category, "Servicios");
assert.equal(createdPayment.status, "pending");
assert.equal(createdPayment.paidAt, null);
assert.equal(
  finance.createFinanceDuePayment(
    { accountId: account.id, description: "Inválido", amountMinor: 0, dueDate: "2026-07-27" },
    new Set([account.id]),
    new Date(timestamp),
  ),
  null,
);
assert.equal(
  finance.patchFinanceDuePayment(createdPayment, { dueDate: "fecha" }, new Set([account.id])),
  null,
);

const paidPayment = finance.setFinanceDuePaymentStatus(
  createdPayment,
  "paid",
  new Date("2026-07-24T09:30:00.000Z"),
);
assert.equal(paidPayment.paidAt, "2026-07-24T09:30:00.000Z");
assert.equal(finance.setFinanceDuePaymentStatus(paidPayment, "pending", new Date(timestamp)).paidAt, null);
assert.equal(finance.getFinanceDuePaymentUrgency(duePayment("late", account.id, "2026-07-22"), "2026-07-23"), "overdue");
assert.equal(finance.getFinanceDuePaymentUrgency(duePayment("today", account.id, "2026-07-23"), "2026-07-23"), "today");
assert.equal(finance.getFinanceDuePaymentUrgency(duePayment("next", account.id, "2026-07-24"), "2026-07-23"), "upcoming");
assert.equal(finance.getFinanceDuePaymentUrgency(paidPayment, "2026-07-23"), "paid");

const pendingLate = duePayment("pending-late", account.id, "2026-07-20");
const pendingNext = duePayment("pending-next", account.id, "2026-07-28");
const paidOlder = duePayment("paid-older", account.id, "2026-07-18", "paid", "2026-07-21T10:00:00.000Z");
const paidRecent = duePayment("paid-recent", account.id, "2026-07-19", "paid", "2026-07-22T10:00:00.000Z");
assert.deepEqual(
  finance.sortedFinanceDuePayments([paidOlder, pendingNext, paidRecent, pendingLate]).map((item) => item.id),
  ["pending-late", "pending-next", "paid-recent", "paid-older"],
);

const removed = finance.removeFinanceAccount(
  [account, usdAccount],
  entries,
  account.id,
  [pendingLate, duePayment("keep", usdAccount.id, "2026-07-30")],
);
assert.deepEqual(removed.accounts.map((item) => item.id), [usdAccount.id]);
assert.deepEqual(removed.entries.map((item) => item.id), [usdIncome.id]);
assert.deepEqual(removed.duePayments.map((item) => item.id), ["keep"]);

const task = {
  id: "task-a",
  title: "Conservar",
  notes: "",
  status: "pending",
  subjectIds: [],
  phaseId: null,
  parentTaskId: null,
  hacerEl: null,
  venceEl: null,
  priority: "normal",
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: null,
};
const legacy = codec.normalizeWorkspaceData({ tasks: [task], subjects: [], phases: [] });
assert.equal(legacy.tasks[0].title, "Conservar");
assert.deepEqual(legacy.financeAccounts, []);
assert.deepEqual(legacy.financeEntries, []);
assert.deepEqual(legacy.financeDuePayments, []);

const normalized = codec.normalizeWorkspaceData({
  tasks: [task],
  subjects: [],
  phases: [],
  financeAccounts: [account, { ...account, id: "bad", currency: "pesos" }],
  financeEntries: [
    julyIncome,
    entry("orphan", "missing", "income", "2026-07-22", 100),
    entry("zero", account.id, "expense", "2026-07-22", 0),
  ],
  financeDuePayments: [
    pendingLate,
    duePayment("orphan-payment", "missing", "2026-07-24"),
    duePayment("invalid-payment", account.id, "not-a-date"),
    duePayment("broken-paid", account.id, "2026-07-24", "paid", null),
  ],
});
assert.deepEqual(normalized.financeAccounts.map((item) => item.id), [account.id]);
assert.deepEqual(normalized.financeEntries.map((item) => item.id), [julyIncome.id]);
assert.deepEqual(normalized.financeDuePayments.map((item) => item.id), [pendingLate.id]);
assert.equal(normalized.tasks.length, 1);
assert.equal(codec.hasWorkspaceContent(normalized), true);

const roundTrip = codec.parseWorkspaceJson(JSON.stringify(normalized));
assert.deepEqual(roundTrip.financeAccounts, normalized.financeAccounts);
assert.deepEqual(roundTrip.financeEntries, normalized.financeEntries);
assert.deepEqual(roundTrip.financeDuePayments, normalized.financeDuePayments);

const memory = new Map();
global.window = {
  localStorage: {
    getItem(key) { return memory.get(key) ?? null; },
    setItem(key, value) { memory.set(key, value); },
  },
};
storage.saveWorkspace(normalized);
assert.deepEqual(storage.loadWorkspace().financeEntries, normalized.financeEntries);
assert.deepEqual(storage.loadWorkspace().financeDuePayments, normalized.financeDuePayments);
delete global.window;

const financeViewSource = fs.readFileSync(
  path.join(__dirname, "..", "app", "components", "finance-view.tsx"),
  "utf8",
);
assert.match(financeViewSource, /role="alert"/);
assert.match(financeViewSource, /window\.confirm/);
assert.match(financeViewSource, /disabled=\{currencyLocked\}/);
assert.match(financeViewSource, /workspace\.updateFinanceEntry/);
assert.match(financeViewSource, /Fecha de vencimiento/);
assert.match(financeViewSource, /workspace\.setFinanceDuePaymentState/);
assert.match(financeViewSource, /workspace\.deleteFinanceDuePayment/);

console.log("Finance domain, persistence, and interaction workflow tests passed.");

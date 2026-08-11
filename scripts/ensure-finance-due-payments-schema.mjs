import fs from "node:fs";
import path from "node:path";

const env = loadEnv([
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), ".env"),
]);
const baseUrl = (env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "").replace(
  /\/+$/,
  "",
);
let tokenCache = null;

if (!baseUrl) throw new Error("Missing PocketBase URL.");

const accounts = await requireCollection("finance_accounts");
let payments = await requireCollection("finance_due_payments");
const accountField = payments.fields.find((field) => field.name === "account");
let currencyField = payments.fields.find((field) => field.name === "currency");

if (
  !accountField ||
  accountField.type !== "relation" ||
  accountField.collectionId !== accounts.id
) {
  throw new Error("finance_due_payments.account is not the expected account relation.");
}

if (accountField.required || !currencyField) {
  payments = await request(`/api/collections/${encodeURIComponent(payments.id)}`, {
    method: "PATCH",
    body: {
      fields: [
        ...payments.fields.filter(
          (field) => field.name !== "account" && field.name !== "currency",
        ),
        { ...accountField, required: false, minSelect: 0, maxSelect: 1 },
        currencyField
          ? { ...currencyField, required: false, min: 0, max: 3 }
          : textField("currency", false, 3),
      ],
    },
  });
  currencyField = payments.fields.find((field) => field.name === "currency");
  console.log("Made finance_due_payments.account optional and ensured currency field.");
}

const accountRecords = await listAllRecords("finance_accounts", "id,currency");
const currencyByAccountId = new Map(
  accountRecords.map((record) => [record.id, String(record.currency || "").toUpperCase()]),
);
const paymentRecords = await listAllRecords(
  "finance_due_payments",
  "id,account,currency",
);

for (const payment of paymentRecords) {
  const currentCurrency = String(payment.currency || "").toUpperCase();
  if (/^[A-Z]{3}$/.test(currentCurrency)) continue;
  const accountId = typeof payment.account === "string" ? payment.account : "";
  const currency = currencyByAccountId.get(accountId);
  if (!currency || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`Cannot derive currency for due payment ${payment.id}.`);
  }
  await request(
    `/api/collections/finance_due_payments/records/${encodeURIComponent(payment.id)}`,
    { method: "PATCH", body: { currency } },
  );
}

payments = await requireCollection("finance_due_payments");
currencyField = payments.fields.find((field) => field.name === "currency");
if (!currencyField || !currencyField.required) {
  payments = await request(`/api/collections/${encodeURIComponent(payments.id)}`, {
    method: "PATCH",
    body: {
      fields: [
        ...payments.fields.filter((field) => field.name !== "currency"),
        {
          ...(currencyField ?? textField("currency", true, 3)),
          required: true,
          min: 1,
          max: 3,
          pattern: "^[A-Z]{3}$",
        },
      ],
    },
  });
  console.log("Made finance_due_payments.currency required after backfill.");
}

const finalAccount = payments.fields.find((field) => field.name === "account");
const finalCurrency = payments.fields.find((field) => field.name === "currency");
if (finalAccount?.required || !finalCurrency?.required) {
  throw new Error("PocketBase due-payment schema did not reach the expected state.");
}

console.log("PocketBase due-payment schema ready.");

function textField(name, required, max) {
  return { name, type: "text", required, min: required ? 1 : 0, max, pattern: "" };
}

async function listAllRecords(collection, fieldList) {
  const records = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await request(
      `/api/collections/${encodeURIComponent(collection)}/records?page=${page}&perPage=200&fields=${encodeURIComponent(fieldList)}`,
    );
    records.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return records;
}

async function requireCollection(name) {
  return request(`/api/collections/${encodeURIComponent(name)}`);
}

async function request(apiPath, options = {}) {
  const response = await fetch(new URL(apiPath, `${baseUrl}/`), {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.auth === false ? {} : { Authorization: `Bearer ${await token()}` }),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const details = payload?.data ? ` ${JSON.stringify(payload.data)}` : "";
    throw new Error(
      `PocketBase ${response.status}: ${payload?.message || response.statusText}${details}`,
    );
  }
  return payload;
}

async function token() {
  if (tokenCache) return tokenCache;
  if (env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN) {
    tokenCache = env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN;
    return tokenCache;
  }
  const identity = env.POCKETBASE_ADMIN_EMAIL || env.PB_ADMIN_EMAIL;
  const password = env.POCKETBASE_ADMIN_PASSWORD || env.PB_ADMIN_PASSWORD;
  if (!identity || !password) throw new Error("Missing PocketBase admin credentials.");
  let lastError;
  for (const endpoint of [
    "/api/collections/_superusers/auth-with-password",
    "/api/admins/auth-with-password",
  ]) {
    try {
      const result = await request(endpoint, {
        method: "POST",
        auth: false,
        body: { identity, password },
      });
      tokenCache = result.token;
      return tokenCache;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function loadEnv(files) {
  const result = { ...process.env };
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || result[match[1]] !== undefined) continue;
      const value = match[2].trim();
      result[match[1]] =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
          ? value.slice(1, -1)
          : value;
    }
  }
  return result;
}

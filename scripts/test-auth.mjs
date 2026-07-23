import assert from "node:assert/strict";
import {
  getSessionCookieOptions,
  getTokenExpiry,
  validateLoginInput,
} from "../app/lib/auth-core.ts";

const invalidEmail = validateLoginInput({
  email: "sin-arroba",
  password: "secreto",
});
assert.equal(invalidEmail.error, "Ingresá un email válido.");

const missingPassword = validateLoginInput({
  email: "persona@ejemplo.com",
  password: "",
});
assert.equal(missingPassword.error, "Ingresá tu contraseña.");

const valid = validateLoginInput({
  email: "  Persona@Ejemplo.com ",
  password: "secreto",
});
assert.deepEqual(valid.credentials, {
  email: "persona@ejemplo.com",
  password: "secreto",
});

const expirySeconds = Math.floor(Date.now() / 1000) + 1800;
const payload = Buffer.from(JSON.stringify({ exp: expirySeconds })).toString("base64url");
const token = `header.${payload}.signature`;
assert.equal(getTokenExpiry(token), expirySeconds * 1000);
assert.equal(getTokenExpiry("token-invalido"), null);

const options = getSessionCookieOptions(token);
assert.equal(options.httpOnly, true);
assert.equal(options.sameSite, "lax");
assert.equal(options.path, "/");
assert.equal(options.priority, "high");
assert.equal(options.expires.getTime(), expirySeconds * 1000);

console.log("Authentication validation and cookie tests passed.");

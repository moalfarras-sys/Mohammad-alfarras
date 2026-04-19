#!/usr/bin/env node
/**
 * Generate a scrypt password hash compatible with apps/web/src/lib/auth.ts.
 *
 * Usage:
 *   node scripts/hash-admin-password.mjs "<your password>"
 *
 * Copy the printed value into ADMIN_PASSWORD_HASH (local + Vercel).
 * Do NOT keep ADMIN_PASSWORD as plain text in production.
 */
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-admin-password.mjs \"<password>\"");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derived = scryptSync(password, salt, 64).toString("hex");
process.stdout.write(`scrypt$${salt}$${derived}\n`);

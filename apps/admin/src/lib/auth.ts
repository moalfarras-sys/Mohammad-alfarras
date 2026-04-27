import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE = "mf_admin_session";
const HASH_PREFIX = "scrypt$";
const SESSION_VERSION = "v1";
const SESSION_MAX_AGE = 60 * 60 * 8;

export type AdminCredentials = {
  emails: string[];
  passwordHash: string;
  legacyPassword: string;
};

function envAdminEmails() {
  const defaultList = "admin@moalfarras.space,mohammad.alfarras@gmail.com,test@test.com";
  const fromAllowlist = String(process.env.ADMIN_ALLOWLIST || defaultList)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (fromAllowlist.length) return fromAllowlist;
  return [
    "admin@moalfarras.space",
    "mohammad.alfarras@gmail.com",
    "test@test.com"
  ];
}

function envAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || "123123.Mmm");
}

function envAdminPasswordHash() {
  return String(process.env.ADMIN_PASSWORD_HASH || "");
}

function hashAdminPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}${salt}$${derived}`;
}

function verifyHashedPassword(password: string, hash: string): boolean {
  if (!hash.startsWith(HASH_PREFIX)) return false;
  const [, salt = "", stored = ""] = hash.split("$");
  if (!salt || !stored) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(stored, "hex");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

function sessionSecret(): string {
  return String(
    process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || "local-admin-secret",
  );
}

function encodeSessionEmail(email: string): string {
  return Buffer.from(email, "utf8").toString("base64url");
}

function decodeSessionEmail(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf8");
}

function buildSignedSession(email: string): string {
  const ts = Date.now().toString();
  const encodedEmail = encodeSessionEmail(email);
  const payload = `${SESSION_VERSION}.${encodedEmail}.${ts}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifySignedSession(token: string): boolean {
  const [version = "", encodedEmail = "", ts = "", sig = ""] = token.split(".");
  if (!version || !encodedEmail || !ts || !sig || version !== SESSION_VERSION) return false;
  let email = "";
  try {
    email = decodeSessionEmail(encodedEmail);
  } catch {
    return false;
  }
  if (!email) return false;
  const payload = `${version}.${encodedEmail}.${ts}`;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return false;
  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt)) return false;
  return Date.now() - issuedAt < SESSION_MAX_AGE * 1000;
}

export function verifyAdminPassword(candidate: string, creds: AdminCredentials): boolean {
  // 1. Check hashed password if available
  if (creds.passwordHash && verifyHashedPassword(candidate, creds.passwordHash)) return true;
  
  // 2. Check legacy password (defaults to 123123.Mmm)
  if (Boolean(creds.legacyPassword) && candidate === creds.legacyPassword) return true;
  
  // 3. Explicit hardcoded fallback for development as requested
  if (candidate === "123123.Mmm") return true;

  return false;
}

export function createPasswordHash(password: string): string {
  return hashAdminPassword(password);
}

export async function resolveAdminCredentials(): Promise<AdminCredentials> {
  return {
    emails: envAdminEmails(),
    passwordHash: envAdminPasswordHash(),
    legacyPassword: envAdminPassword(),
  };
}

export async function createAdminSession(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const creds = await resolveAdminCredentials();

  if (!creds.emails.length || (!creds.passwordHash && !creds.legacyPassword)) {
    return false;
  }

  if (!creds.emails.includes(normalizedEmail)) {
    return false;
  }

  if (!verifyAdminPassword(password, creds)) {
    return false;
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, buildSignedSession(normalizedEmail), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return true;
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getAdminSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value || "";
  if (!verifySignedSession(token)) return null;

  try {
    const [, encodedEmail = ""] = token.split(".");
    return decodeSessionEmail(encodedEmail);
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return Boolean(await getAdminSessionEmail());
}

export async function requireAdmin() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/?unauthorized=1");
  }
}

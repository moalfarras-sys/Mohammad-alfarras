import { randomInt } from "node:crypto";

export const ACTIVATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";
export const ACTIVATION_CODE_PATTERN = /^MO-[A-HJ-NP-RT-Z2-46789]{4}$/;
export const ACTIVATION_CODE_TTL_MINUTES = 15;

export function normalizeActivationCode(value: string | null | undefined) {
  const shortCode = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^MO-?/, "")
    .replace(/[^A-Z2-9]/g, "")
    .replace(/[O0I1S5]/g, "")
    .slice(0, 4);

  return `MO-${shortCode}`;
}

export function isValidActivationCode(value: string) {
  return ACTIVATION_CODE_PATTERN.test(value);
}

export function createActivationCode() {
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += ACTIVATION_CODE_ALPHABET[randomInt(0, ACTIVATION_CODE_ALPHABET.length)];
  }
  return `MO-${code}`;
}

export function activationExpiresAt() {
  return new Date(Date.now() + ACTIVATION_CODE_TTL_MINUTES * 60 * 1000).toISOString();
}

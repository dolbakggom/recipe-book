import { createHash, randomBytes } from "node:crypto";

export const OWNER_COOKIE_NAME = "recipe_book_owner";
export const OWNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function createOwnerToken() {
  return randomBytes(32).toString("hex");
}

export function hashOwnerToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeOwnerTokenHash(value: string | null | undefined) {
  const tokenHash = String(value ?? "").trim();
  return tokenHash || null;
}

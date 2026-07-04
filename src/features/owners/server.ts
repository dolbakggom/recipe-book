import { cookies } from "next/headers";
import {
  createOwnerToken,
  hashOwnerToken,
  OWNER_COOKIE_MAX_AGE,
  OWNER_COOKIE_NAME
} from "./tokens";

const ownerCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: OWNER_COOKIE_MAX_AGE
};

export async function getCurrentOwnerTokenHash() {
  const cookieStore = await cookies();
  const ownerToken = cookieStore.get(OWNER_COOKIE_NAME)?.value;

  return ownerToken ? hashOwnerToken(ownerToken) : null;
}

export async function getOrCreateOwnerTokenHash() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(OWNER_COOKIE_NAME)?.value;

  if (existingToken) {
    return hashOwnerToken(existingToken);
  }

  const token = createOwnerToken();
  cookieStore.set(OWNER_COOKIE_NAME, token, ownerCookieOptions);

  return hashOwnerToken(token);
}

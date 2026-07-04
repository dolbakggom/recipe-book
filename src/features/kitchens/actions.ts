"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertKitchenAdmin,
  createKitchen,
  deleteKitchenForOwner,
  updateKitchen
} from "./data";
import {
  getCurrentOwnerTokenHash,
  getOrCreateOwnerTokenHash
} from "@/features/owners/server";
import { paths } from "@/lib/paths";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createKitchenAction(formData: FormData) {
  const ownerTokenHash = await getOrCreateOwnerTokenHash();
  const kitchen = await createKitchen({
    name: value(formData, "name"),
    description: value(formData, "description"),
    ownerTokenHash,
    type: value(formData, "type") === "STORE" ? "STORE" : "PERSONAL",
    visibility: "PRIVATE"
  });
  revalidatePath(paths.kitchens());
  redirect(paths.kitchen(kitchen.id));
}

export async function updateKitchenAction(kitchenId: string, formData: FormData) {
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  await assertKitchenAdmin(kitchenId, ownerTokenHash);
  await updateKitchen(kitchenId, {
    name: value(formData, "name"),
    description: value(formData, "description"),
    type: value(formData, "type") === "STORE" ? "STORE" : "PERSONAL",
    visibility: value(formData, "visibility") === "SHARED" ? "SHARED" : "PRIVATE"
  });
  revalidatePath(paths.kitchen(kitchenId));
  revalidatePath(paths.kitchens());
}

export async function deleteKitchenAction(kitchenId: string) {
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  await deleteKitchenForOwner(kitchenId, ownerTokenHash);
  revalidatePath(paths.kitchens());
  redirect(paths.kitchens());
}

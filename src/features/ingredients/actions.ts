"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createIngredient, deleteIngredient, updateIngredient } from "./data";
import { paths } from "@/lib/paths";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createIngredientAction(formData: FormData) {
  const ingredient = await createIngredient({
    kitchenId: value(formData, "kitchenId"),
    name: value(formData, "name"),
    category: value(formData, "category"),
    defaultUnit: value(formData, "defaultUnit"),
    description: value(formData, "description"),
    allergenInfo: value(formData, "allergenInfo")
  });
  revalidatePath(paths.ingredients(ingredient.kitchenId));
  redirect(paths.ingredient(ingredient.id));
}

export async function updateIngredientAction(
  ingredientId: string,
  formData: FormData
) {
  const ingredient = await updateIngredient(ingredientId, {
    kitchenId: value(formData, "kitchenId"),
    name: value(formData, "name"),
    category: value(formData, "category"),
    defaultUnit: value(formData, "defaultUnit"),
    description: value(formData, "description"),
    allergenInfo: value(formData, "allergenInfo")
  });
  revalidatePath(paths.ingredient(ingredient.id));
  revalidatePath(paths.ingredients(ingredient.kitchenId));
}

export async function deleteIngredientAction(ingredientId: string) {
  await deleteIngredient(ingredientId);
  revalidatePath(paths.ingredients());
  redirect(paths.ingredients());
}

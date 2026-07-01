"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecipe,
  deleteRecipe,
  getRecipeDetail,
  updateRecipe
} from "./data";
import { formFile, formValue, orderedValues } from "@/lib/form";
import { paths } from "@/lib/paths";
import { saveUpload } from "@/lib/uploads";

export async function createRecipeAction(formData: FormData) {
  const imagePath = await saveUpload(formFile(formData, "coverImage"));
  const recipe = await createRecipe(buildRecipeInput(formData, imagePath));

  revalidatePath(paths.kitchen(recipe.kitchenId));
  redirect(paths.recipe(recipe.kitchenId, recipe.id));
}

export async function updateRecipeAction(
  recipeId: string,
  formData: FormData
) {
  const imagePath = await saveUpload(formFile(formData, "coverImage"));
  const coverImage =
    imagePath ?? (await getRecipeDetail(recipeId))?.coverImage ?? null;
  const recipe = await updateRecipe(
    recipeId,
    buildRecipeInput(formData, coverImage)
  );

  revalidatePath(paths.recipe(recipe.kitchenId, recipe.id));
  revalidatePath(paths.kitchen(recipe.kitchenId));
}

export async function deleteRecipeAction(recipeId: string, kitchenId: string) {
  await deleteRecipe(recipeId);
  revalidatePath(paths.kitchen(kitchenId));
  redirect(paths.kitchen(kitchenId));
}

function buildRecipeInput(formData: FormData, imagePath: string | null) {
  const ingredientIds = orderedValues(formData, "ingredientId");
  const amounts = orderedValues(formData, "amount");
  const units = orderedValues(formData, "unit");
  const notes = orderedValues(formData, "note");
  const stepTitles = orderedValues(formData, "stepTitle");
  const stepDescriptions = orderedValues(formData, "stepDescription");

  return {
    kitchenId: formValue(formData, "kitchenId"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    coverImage: imagePath,
    markdownContent: formValue(formData, "markdownContent"),
    ingredients: ingredientIds
      .map((ingredientId, index) => ({
        ingredientId: ingredientId.trim(),
        amount: valueAt(amounts, index),
        unit: valueAt(units, index),
        note: valueAt(notes, index)
      }))
      .filter((ingredient) => ingredient.ingredientId)
      .map((ingredient, index) => ({
        ...ingredient,
        order: index + 1
      })),
    steps: stepTitles
      .map((title, index) => ({
        title,
        description: valueAt(stepDescriptions, index)
      }))
      .filter((step) => step.title.trim() || step.description.trim())
      .map((step, index) => ({
        ...step,
        order: index + 1
      }))
  };
}

function valueAt(values: string[], index: number) {
  return values[index] ?? "";
}

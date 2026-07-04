"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecipe,
  deleteRecipe,
  getRecipeDetail,
  updateRecipe
} from "./data";
import { recipeInputFromFormData } from "./form";
import { summarizeRecipeDraft } from "@/features/ai/recipe";
import { assertKitchenAdmin } from "@/features/kitchens/data";
import { getCurrentOwnerTokenHash } from "@/features/owners/server";
import { formFile, formValue } from "@/lib/form";
import { paths } from "@/lib/paths";
import { saveUpload } from "@/lib/uploads";

export async function createRecipeAction(formData: FormData) {
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  const kitchenId = formValue(formData, "kitchenId");

  await assertKitchenAdmin(kitchenId, ownerTokenHash);

  const input = await recipeInputFromFormData(
    formData,
    null,
    undefined,
    summarizeRecipeDraft
  );
  const imagePath = await saveUpload(formFile(formData, "coverImage"));

  const recipe = await createRecipe({
    ...input,
    coverImage: imagePath
  });

  revalidatePath(paths.kitchen(recipe.kitchenId));
  redirect(paths.recipe(recipe.kitchenId, recipe.id));
}

export async function updateRecipeAction(
  recipeId: string,
  formData: FormData
) {
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  const kitchenId = formValue(formData, "kitchenId");
  const existingRecipe = await getRecipeDetail(recipeId);

  if (!existingRecipe || existingRecipe.kitchenId !== kitchenId) {
    throw new Error("Recipe was not found in this kitchen");
  }

  await assertKitchenAdmin(kitchenId, ownerTokenHash);

  const imagePath = await saveUpload(formFile(formData, "coverImage"));
  const coverImage = imagePath ?? existingRecipe.coverImage ?? null;
  const input = await recipeInputFromFormData(
    formData,
    coverImage,
    undefined,
    summarizeRecipeDraft
  );

  const recipe = await updateRecipe(recipeId, input);

  revalidatePath(paths.recipe(recipe.kitchenId, recipe.id));
  revalidatePath(paths.kitchen(recipe.kitchenId));
}

export async function deleteRecipeAction(recipeId: string, kitchenId: string) {
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  const recipe = await getRecipeDetail(recipeId);

  if (!recipe || recipe.kitchenId !== kitchenId) {
    throw new Error("Recipe was not found in this kitchen");
  }

  await assertKitchenAdmin(kitchenId, ownerTokenHash);
  await deleteRecipe(recipeId);
  revalidatePath(paths.kitchen(kitchenId));
  redirect(paths.kitchen(kitchenId));
}

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
import { formFile } from "@/lib/form";
import { paths } from "@/lib/paths";
import { saveUpload } from "@/lib/uploads";

export async function createRecipeAction(formData: FormData) {
  const imagePath = await saveUpload(formFile(formData, "coverImage"));
  const recipe = await createRecipe(
    await recipeInputFromFormData(formData, imagePath)
  );

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
    await recipeInputFromFormData(formData, coverImage)
  );

  revalidatePath(paths.recipe(recipe.kitchenId, recipe.id));
  revalidatePath(paths.kitchen(recipe.kitchenId));
}

export async function deleteRecipeAction(recipeId: string, kitchenId: string) {
  await deleteRecipe(recipeId);
  revalidatePath(paths.kitchen(kitchenId));
  redirect(paths.kitchen(kitchenId));
}

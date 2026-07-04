"use server";

import { redirect } from "next/navigation";
import { paths } from "@/lib/paths";
import { createShareLink } from "./data";
import { assertKitchenAdmin } from "@/features/kitchens/data";
import { getCurrentOwnerTokenHash } from "@/features/owners/server";
import { getRecipeDetail } from "@/features/recipes/data";

export async function createRecipeShareAction(recipeId: string) {
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  const recipe = await getRecipeDetail(recipeId);

  if (!recipe) {
    throw new Error("Recipe was not found");
  }

  await assertKitchenAdmin(recipe.kitchenId, ownerTokenHash);

  const share = await createShareLink({
    type: "RECIPE",
    targetId: recipeId
  });

  redirect(paths.shared(share.token));
}

export async function createKitchenShareAction(kitchenId: string) {
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  await assertKitchenAdmin(kitchenId, ownerTokenHash);

  const share = await createShareLink({
    type: "KITCHEN",
    targetId: kitchenId
  });

  redirect(paths.shared(share.token));
}

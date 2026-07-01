"use server";

import { redirect } from "next/navigation";
import { paths } from "@/lib/paths";
import { createShareLink } from "./data";

export async function createRecipeShareAction(recipeId: string) {
  const share = await createShareLink({
    type: "RECIPE",
    targetId: recipeId
  });

  redirect(paths.shared(share.token));
}

export async function createKitchenShareAction(kitchenId: string) {
  const share = await createShareLink({
    type: "KITCHEN",
    targetId: kitchenId
  });

  redirect(paths.shared(share.token));
}

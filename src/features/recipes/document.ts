type RecipeIngredientLike = {
  amount: string;
  unit: string;
  note: string;
  ingredient: {
    name: string;
  };
};

type RecipeDocumentLike = {
  markdownContent: string;
  recipeIngredients: RecipeIngredientLike[];
};

export type IngredientSummary = {
  key: string;
  name: string;
  amountText: string;
  note: string;
};

export function ingredientSummariesFromRecipe(
  recipe: RecipeDocumentLike
): IngredientSummary[] {
  if (recipe.recipeIngredients.length > 0) {
    return recipe.recipeIngredients.map((item, index) => ({
      key: `ingredient-${index}-${item.ingredient.name}`,
      name: item.ingredient.name,
      amountText: formatAmount(item.amount, item.unit),
      note: item.note
    }));
  }

  return extractIngredientLines(recipe.markdownContent).map((name, index) => ({
    key: `markdown-${index}-${name}`,
    name,
    amountText: "",
    note: ""
  }));
}

function extractIngredientLines(markdownContent: string) {
  const lines = markdownContent.split(/\r?\n/);
  const ingredients: string[] = [];
  let inIngredientsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^#{1,6}\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,6}\s*/, "").trim().toLowerCase();
      inIngredientsSection =
        heading === "재료" ||
        heading === "재료 정보" ||
        heading === "ingredients";
      continue;
    }

    if (!inIngredientsSection) {
      continue;
    }

    const ingredient = trimmed.match(/^[-*]\s+(.+)$/)?.[1]?.trim();

    if (ingredient) {
      ingredients.push(ingredient);
    }
  }

  return ingredients;
}

function formatAmount(amount: string, unit: string) {
  return [amount, unit].filter(Boolean).join(" ");
}

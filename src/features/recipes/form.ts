import type { Prisma, PrismaClient } from "@prisma/client";
import type { AiRecipeSuggestion } from "@/features/ai/recipe";
import type { RecipeInput } from "./data";
import { prisma } from "@/lib/db";
import { formValue, orderedValues } from "@/lib/form";

type Db = PrismaClient | Prisma.TransactionClient;

type IngredientRow = {
  ingredientId: string;
  amount: string;
  unit: string;
  note: string;
};

type StepRow = {
  title: string;
  description: string;
};

type RecipeDraftSummarizer = (rawText: string) => Promise<AiRecipeSuggestion>;

export async function recipeInputFromFormData(
  formData: FormData,
  imagePath: string | null,
  db: Db = prisma,
  summarizeDraft?: RecipeDraftSummarizer
): Promise<RecipeInput> {
  const kitchenId = formValue(formData, "kitchenId");
  const summary = await summarizeRawTextIfNeeded(formData, summarizeDraft);
  const ingredients = await ingredientRowsFromFormData(
    formData,
    kitchenId,
    db,
    summary
  );
  const steps = stepRowsFromFormData(formData, summary);
  const rawText = formValue(formData, "rawRecipeText");

  return {
    kitchenId,
    title: firstFilled(
      formValue(formData, "title"),
      formValue(formData, "aiTitle"),
      summary?.title ?? "",
      fallbackTitleFromRawText(rawText)
    ),
    description: firstFilled(
      formValue(formData, "description"),
      formValue(formData, "aiDescription"),
      summary?.description ?? ""
    ),
    coverImage: imagePath,
    markdownContent: firstFilled(
      formValue(formData, "markdownContent"),
      formValue(formData, "aiMarkdownContent"),
      summary?.markdownContent ?? "",
      rawText
    ),
    ingredients: dedupeIngredientRows(ingredients).map((ingredient, index) => ({
      ...ingredient,
      order: index + 1
    })),
    steps: steps
      .filter((step) => step.title.trim() || step.description.trim())
      .map((step, index) => ({
        ...step,
        order: index + 1
      }))
  };
}

async function ingredientRowsFromFormData(
  formData: FormData,
  kitchenId: string,
  db: Db,
  summary: AiRecipeSuggestion | null
): Promise<IngredientRow[]> {
  const ingredients = summary?.ingredients ?? ingredientInputsFromFormData(formData);
  const rows: IngredientRow[] = [];

  for (const ingredientInput of ingredients) {
    const name = ingredientInput.name.trim();

    if (!name) {
      continue;
    }

    const ingredient = await db.ingredient.upsert({
      where: {
        kitchenId_name: {
          kitchenId,
          name
        }
      },
      update: {},
      create: {
        kitchenId,
        name
      }
    });

    rows.push({
      ingredientId: ingredient.id,
      amount: ingredientInput.amount,
      unit: ingredientInput.unit,
      note: ingredientInput.note
    });
  }

  return rows;
}

function ingredientInputsFromFormData(formData: FormData) {
  const names = orderedValues(formData, "aiIngredientName");
  const amounts = orderedValues(formData, "aiAmount");
  const units = orderedValues(formData, "aiUnit");
  const notes = orderedValues(formData, "aiNote");

  return names.map((name, index) => ({
    name,
    amount: valueAt(amounts, index),
    unit: valueAt(units, index),
    note: valueAt(notes, index)
  }));
}

function stepRowsFromFormData(
  formData: FormData,
  summary: AiRecipeSuggestion | null
): StepRow[] {
  if (summary) {
    return summary.steps;
  }

  const titles = orderedValues(formData, "aiStepTitle");
  const descriptions = orderedValues(formData, "aiStepDescription");

  return titles.map((title, index) => ({
    title,
    description: valueAt(descriptions, index)
  }));
}

async function summarizeRawTextIfNeeded(
  formData: FormData,
  summarizeDraft?: RecipeDraftSummarizer
) {
  if (!summarizeDraft) {
    return null;
  }

  const rawText = formValue(formData, "rawRecipeText");

  if (!rawText.trim() || hasAiResultPayload(formData)) {
    return null;
  }

  const title = formValue(formData, "title");
  const markdownContent = formValue(formData, "markdownContent");

  if (title.trim() && markdownContent.trim()) {
    return null;
  }

  return summarizeDraft(rawText);
}

function hasAiResultPayload(formData: FormData) {
  return Boolean(
    formValue(formData, "aiResultActive").trim() ||
      formValue(formData, "aiTitle").trim() ||
      formValue(formData, "aiMarkdownContent").trim() ||
      orderedValues(formData, "aiIngredientName").some((name) => name.trim())
  );
}

function dedupeIngredientRows(rows: IngredientRow[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    if (seen.has(row.ingredientId)) {
      return false;
    }

    seen.add(row.ingredientId);
    return true;
  });
}

function fallbackTitleFromRawText(rawText: string) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 40) ?? "새 레시피";
}

function firstFilled(...values: string[]) {
  return values.find((value) => value.trim()) ?? "";
}

function valueAt(values: string[], index: number) {
  return values[index] ?? "";
}

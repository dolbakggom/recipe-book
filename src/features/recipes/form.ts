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
type AiPayload = AiRecipeSuggestion;

export async function recipeInputFromFormData(
  formData: FormData,
  imagePath: string | null,
  db: Db = prisma,
  summarizeDraft?: RecipeDraftSummarizer
): Promise<RecipeInput> {
  const kitchenId = formValue(formData, "kitchenId");
  const rawText = formValue(formData, "rawRecipeText");
  const staleAiPayload = staleAiPayloadFromFormData(formData, rawText);
  const aiPayload = aiPayloadFromFormData(formData, rawText);
  const title = fieldValueIgnoringStaleAi(
    formData,
    "title",
    staleAiPayload?.title
  );
  const description = fieldValueIgnoringStaleAi(
    formData,
    "description",
    staleAiPayload?.description
  );
  const markdownContent = fieldValueIgnoringStaleAi(
    formData,
    "markdownContent",
    staleAiPayload?.markdownContent
  );
  const summary = await summarizeRawTextIfNeeded({
    rawText,
    title,
    markdownContent,
    hasFreshAiPayload: Boolean(aiPayload),
    hasStaleAiPayload: Boolean(staleAiPayload),
    summarizeDraft
  });
  const ingredients = await ingredientRowsFromFormData(
    kitchenId,
    db,
    aiPayload,
    summary
  );
  const steps = stepRowsFromFormData(formData, aiPayload, summary);

  return {
    kitchenId,
    title: firstFilled(
      title,
      summary?.title ?? "",
      aiPayload?.title ?? "",
      fallbackTitleFromRawText(rawText)
    ),
    description: firstFilled(
      description,
      summary?.description ?? "",
      aiPayload?.description ?? ""
    ),
    coverImage: imagePath,
    markdownContent: firstFilled(
      markdownContent,
      summary?.markdownContent ?? "",
      aiPayload?.markdownContent ?? "",
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
  kitchenId: string,
  db: Db,
  aiPayload: AiPayload | null,
  summary: AiRecipeSuggestion | null
): Promise<IngredientRow[]> {
  const ingredients = summary?.ingredients ?? aiPayload?.ingredients ?? [];
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
  aiPayload: AiPayload | null,
  summary: AiRecipeSuggestion | null
): StepRow[] {
  if (summary) {
    return summary.steps;
  }

  if (aiPayload) {
    return aiPayload.steps;
  }

  const titles = orderedValues(formData, "aiStepTitle");
  const descriptions = orderedValues(formData, "aiStepDescription");

  return titles.map((title, index) => ({
    title,
    description: valueAt(descriptions, index)
  }));
}

async function summarizeRawTextIfNeeded(
  input: {
    rawText: string;
    title: string;
    markdownContent: string;
    hasFreshAiPayload: boolean;
    hasStaleAiPayload: boolean;
    summarizeDraft?: RecipeDraftSummarizer;
  }
) {
  if (!input.summarizeDraft) {
    return null;
  }

  if (!input.rawText.trim() || input.hasFreshAiPayload) {
    return null;
  }

  if (
    !input.hasStaleAiPayload &&
    input.title.trim() &&
    input.markdownContent.trim()
  ) {
    return null;
  }

  return input.summarizeDraft(input.rawText);
}

function aiPayloadFromFormData(formData: FormData, rawText: string) {
  const payload = aiPayloadValuesFromFormData(formData);

  if (!payload || isAiPayloadStale(formData, rawText)) {
    return null;
  }

  return payload;
}

function staleAiPayloadFromFormData(formData: FormData, rawText: string) {
  const payload = aiPayloadValuesFromFormData(formData);

  if (!payload || !isAiPayloadStale(formData, rawText)) {
    return null;
  }

  return payload;
}

function aiPayloadValuesFromFormData(formData: FormData): AiPayload | null {
  const ingredients = ingredientInputsFromFormData(formData);
  const steps = aiStepRowsFromFormData(formData);
  const title = formValue(formData, "aiTitle");
  const description = formValue(formData, "aiDescription");
  const markdownContent = formValue(formData, "aiMarkdownContent");
  const hasPayload = Boolean(
    formValue(formData, "aiResultActive").trim() ||
      title.trim() ||
      description.trim() ||
      markdownContent.trim() ||
      ingredients.some((ingredient) => ingredient.name.trim()) ||
      steps.some((step) => step.title.trim() || step.description.trim())
  );

  if (!hasPayload) {
    return null;
  }

  return {
    title,
    description,
    markdownContent,
    ingredients,
    steps
  };
}

function aiStepRowsFromFormData(formData: FormData): StepRow[] {
  const titles = orderedValues(formData, "aiStepTitle");
  const descriptions = orderedValues(formData, "aiStepDescription");

  return titles.map((title, index) => ({
    title,
    description: valueAt(descriptions, index)
  }));
}

function isAiPayloadStale(formData: FormData, rawText: string) {
  const trimmedRawText = rawText.trim();

  if (!trimmedRawText) {
    return false;
  }

  return formValue(formData, "aiSourceText").trim() !== trimmedRawText;
}

function fieldValueIgnoringStaleAi(
  formData: FormData,
  fieldName: string,
  staleAiValue: string | undefined
) {
  const value = formValue(formData, fieldName);

  if (staleAiValue !== undefined && value.trim() === staleAiValue.trim()) {
    return "";
  }

  return value;
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

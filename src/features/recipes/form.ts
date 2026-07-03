import type { Prisma, PrismaClient } from "@prisma/client";
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

export async function recipeInputFromFormData(
  formData: FormData,
  imagePath: string | null,
  db: Db = prisma
): Promise<RecipeInput> {
  const kitchenId = formValue(formData, "kitchenId");
  const ingredients = await aiIngredientRowsFromFormData(
    formData,
    kitchenId,
    db
  );
  const steps = aiStepRowsFromFormData(formData);

  return {
    kitchenId,
    title: firstFilled(
      formValue(formData, "title"),
      formValue(formData, "aiTitle")
    ),
    description: firstFilled(
      formValue(formData, "description"),
      formValue(formData, "aiDescription")
    ),
    coverImage: imagePath,
    markdownContent: firstFilled(
      formValue(formData, "markdownContent"),
      formValue(formData, "aiMarkdownContent")
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

async function aiIngredientRowsFromFormData(
  formData: FormData,
  kitchenId: string,
  db: Db
): Promise<IngredientRow[]> {
  const names = orderedValues(formData, "aiIngredientName");
  const amounts = orderedValues(formData, "aiAmount");
  const units = orderedValues(formData, "aiUnit");
  const notes = orderedValues(formData, "aiNote");
  const rows: IngredientRow[] = [];

  for (const [index, rawName] of names.entries()) {
    const name = rawName.trim();

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
      amount: valueAt(amounts, index),
      unit: valueAt(units, index),
      note: valueAt(notes, index)
    });
  }

  return rows;
}

function aiStepRowsFromFormData(formData: FormData): StepRow[] {
  const titles = orderedValues(formData, "aiStepTitle");
  const descriptions = orderedValues(formData, "aiStepDescription");

  return titles.map((title, index) => ({
    title,
    description: valueAt(descriptions, index)
  }));
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

function firstFilled(...values: string[]) {
  return values.find((value) => value.trim()) ?? "";
}

function valueAt(values: string[], index: number) {
  return values[index] ?? "";
}

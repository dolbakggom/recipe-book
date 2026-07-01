import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;
type Tx = Prisma.TransactionClient;

const localUploadPathPattern =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/;

const recipeIngredientInputSchema = z.object({
  ingredientId: z.string().trim().min(1, "Ingredient is required"),
  amount: z.string().trim().optional().default(""),
  unit: z.string().trim().optional().default(""),
  note: z.string().trim().optional().default(""),
  order: z.coerce.number().int().nonnegative().default(0)
});

const recipeStepInputSchema = z.object({
  title: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  order: z.coerce.number().int().nonnegative().default(0)
});

const recipeInputSchema = z.object({
  kitchenId: z.string().trim().min(1, "Kitchen is required"),
  title: z.string().trim().min(1, "Recipe title is required"),
  description: z.string().trim().optional().default(""),
  coverImage: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (coverImage) =>
        !coverImage || localUploadPathPattern.test(coverImage),
      "Recipe cover image must be a local upload path"
    ),
  markdownContent: z.string().trim().optional().default(""),
  ingredients: z.array(recipeIngredientInputSchema).optional().default([]),
  steps: z.array(recipeStepInputSchema).optional().default([])
});

export type RecipeInput = z.input<typeof recipeInputSchema>;

export async function listRecipesForKitchen(kitchenId: string, db: Db = prisma) {
  return db.recipe.findMany({
    where: { kitchenId },
    orderBy: { updatedAt: "desc" },
    include: {
      recipeIngredients: {
        take: 4,
        orderBy: { order: "asc" },
        include: { ingredient: true }
      }
    }
  });
}

export async function getRecipeDetail(id: string, db: Db = prisma) {
  return db.recipe.findUnique({
    where: { id },
    include: {
      kitchen: true,
      recipeIngredients: {
        orderBy: { order: "asc" },
        include: { ingredient: true }
      },
      steps: {
        orderBy: { order: "asc" }
      }
    }
  });
}

export async function createRecipe(input: RecipeInput, db: Db = prisma) {
  const parsed = recipeInputSchema.parse(input);

  return db.$transaction(async (tx) => {
    await assertIngredientsBelongToKitchen(
      parsed.kitchenId,
      parsed.ingredients,
      tx
    );

    return tx.recipe.create({
      data: {
        kitchenId: parsed.kitchenId,
        title: parsed.title,
        description: parsed.description,
        coverImage: parsed.coverImage || null,
        markdownContent: parsed.markdownContent,
        recipeIngredients: {
          create: parsed.ingredients.map((ingredient) => ({
            ingredientId: ingredient.ingredientId,
            amount: ingredient.amount,
            unit: ingredient.unit,
            note: ingredient.note,
            order: ingredient.order
          }))
        },
        steps: {
          create: parsed.steps.map((step) => ({
            title: step.title,
            description: step.description,
            order: step.order
          }))
        }
      }
    });
  });
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
  db: Db = prisma
) {
  const parsed = recipeInputSchema.parse(input);

  return db.$transaction(async (tx) => {
    const existing = await tx.recipe.findUnique({
      where: { id },
      select: { kitchenId: true }
    });

    if (existing && existing.kitchenId !== parsed.kitchenId) {
      throw new Error("Recipe kitchen cannot change while editing");
    }

    await assertIngredientsBelongToKitchen(
      parsed.kitchenId,
      parsed.ingredients,
      tx
    );
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    await tx.recipeStep.deleteMany({ where: { recipeId: id } });

    return tx.recipe.update({
      where: { id },
      data: {
        kitchenId: parsed.kitchenId,
        title: parsed.title,
        description: parsed.description,
        coverImage: parsed.coverImage || null,
        markdownContent: parsed.markdownContent,
        recipeIngredients: {
          create: parsed.ingredients.map((ingredient) => ({
            ingredientId: ingredient.ingredientId,
            amount: ingredient.amount,
            unit: ingredient.unit,
            note: ingredient.note,
            order: ingredient.order
          }))
        },
        steps: {
          create: parsed.steps.map((step) => ({
            title: step.title,
            description: step.description,
            order: step.order
          }))
        }
      }
    });
  });
}

export async function deleteRecipe(id: string, db: Db = prisma) {
  return db.recipe.delete({
    where: { id }
  });
}

async function assertIngredientsBelongToKitchen(
  kitchenId: string,
  ingredients: Array<z.output<typeof recipeIngredientInputSchema>>,
  db: Db | Tx
) {
  const ingredientIds = [
    ...new Set(ingredients.map((ingredient) => ingredient.ingredientId))
  ];

  if (ingredientIds.length === 0) {
    return;
  }

  const matchingIngredients = await db.ingredient.findMany({
    where: {
      id: { in: ingredientIds }
    },
    select: {
      id: true,
      kitchenId: true
    }
  });

  if (
    matchingIngredients.length !== ingredientIds.length ||
    matchingIngredients.some((ingredient) => ingredient.kitchenId !== kitchenId)
  ) {
    throw new Error("Recipe ingredients must belong to the same kitchen");
  }
}

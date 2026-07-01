import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const ingredientInputSchema = z.object({
  kitchenId: z.string().min(1, "Kitchen is required"),
  name: z.string().trim().min(1, "Ingredient name is required"),
  category: z.string().trim().optional().default(""),
  defaultUnit: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  allergenInfo: z.string().trim().optional().default("")
});

export type IngredientInput = z.input<typeof ingredientInputSchema>;

export async function listIngredients(
  filters: { kitchenId?: string; query?: string } = {},
  db: Db = prisma
) {
  return db.ingredient.findMany({
    where: {
      kitchenId: filters.kitchenId || undefined,
      name: filters.query
        ? {
            contains: filters.query
          }
        : undefined
    },
    orderBy: [{ name: "asc" }]
  });
}

export async function getIngredientWithRecipes(id: string, db: Db = prisma) {
  return db.ingredient.findUnique({
    where: { id },
    include: {
      kitchen: true,
      recipeIngredients: {
        orderBy: { recipe: { updatedAt: "desc" } },
        include: {
          recipe: {
            include: {
              kitchen: true
            }
          }
        }
      }
    }
  });
}

export async function createIngredient(input: IngredientInput, db: Db = prisma) {
  const parsed = ingredientInputSchema.parse(input);
  return db.ingredient.create({
    data: parsed
  });
}

export async function updateIngredient(
  id: string,
  input: IngredientInput,
  db: Db = prisma
) {
  const parsed = ingredientInputSchema.parse(input);
  const existing = await db.ingredient.findUnique({
    where: { id },
    select: { kitchenId: true }
  });

  if (existing && existing.kitchenId !== parsed.kitchenId) {
    const recipeIngredientCount = await db.recipeIngredient.count({
      where: { ingredientId: id }
    });

    if (recipeIngredientCount > 0) {
      throw new Error("Ingredient kitchen cannot change while used by recipes");
    }
  }

  return db.ingredient.update({
    where: { id },
    data: parsed
  });
}

export async function deleteIngredient(id: string, db: Db = prisma) {
  const recipeIngredientCount = await db.recipeIngredient.count({
    where: { ingredientId: id }
  });

  if (recipeIngredientCount > 0) {
    throw new Error("Ingredient is used by recipes");
  }

  return db.ingredient.delete({
    where: { id }
  });
}

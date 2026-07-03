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

export async function createIngredient(input: IngredientInput, db: Db = prisma) {
  const parsed = ingredientInputSchema.parse(input);
  return db.ingredient.create({
    data: parsed
  });
}

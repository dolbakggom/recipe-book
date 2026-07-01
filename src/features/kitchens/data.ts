import type { KitchenType, PrismaClient, Visibility } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const kitchenInputSchema = z.object({
  name: z.string().trim().min(1, "Kitchen name is required"),
  description: z.string().trim().optional().default(""),
  coverImage: z.string().trim().optional().nullable(),
  type: z.enum(["PERSONAL", "STORE"]).default("PERSONAL"),
  visibility: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE")
});

export type KitchenInput = z.input<typeof kitchenInputSchema>;

export async function listKitchens(db: Db = prisma) {
  return db.kitchen.findMany({
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          recipes: true,
          ingredients: true
        }
      }
    }
  });
}

export async function getKitchen(id: string, db: Db = prisma) {
  return db.kitchen.findUnique({
    where: { id },
    include: {
      recipes: {
        orderBy: [{ updatedAt: "desc" }],
        include: {
          recipeIngredients: {
            take: 4,
            orderBy: { order: "asc" },
            include: { ingredient: true }
          }
        }
      },
      ingredients: {
        orderBy: { name: "asc" }
      }
    }
  });
}

export async function createKitchen(input: KitchenInput, db: Db = prisma) {
  const parsed = kitchenInputSchema.parse(input);
  return db.kitchen.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      coverImage: parsed.coverImage || null,
      type: parsed.type as KitchenType,
      visibility: parsed.visibility as Visibility
    }
  });
}

export async function updateKitchen(
  id: string,
  input: KitchenInput,
  db: Db = prisma
) {
  const parsed = kitchenInputSchema.parse(input);
  return db.kitchen.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description,
      coverImage: parsed.coverImage || null,
      type: parsed.type as KitchenType,
      visibility: parsed.visibility as Visibility
    }
  });
}

export async function deleteKitchen(id: string, db: Db = prisma) {
  return db.kitchen.delete({
    where: { id }
  });
}

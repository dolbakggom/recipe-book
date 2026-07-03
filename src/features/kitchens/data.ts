import type {
  KitchenType,
  Prisma,
  PrismaClient,
  Visibility
} from "@prisma/client";
import { z } from "zod";
import {
  coverImageErrorMessage,
  isSavedCoverImageUrl
} from "@/lib/cover-image";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const coverImageSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(isSavedCoverImageUrl, coverImageErrorMessage);

const kitchenInputSchema = z.object({
  name: z.string().trim().min(1, "Kitchen name is required"),
  description: z.string().trim().optional().default(""),
  coverImage: coverImageSchema,
  type: z.enum(["PERSONAL", "STORE"]).default("PERSONAL"),
  visibility: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE")
});

const kitchenUpdateInputSchema = z.object({
  name: z.string().trim().min(1, "Kitchen name is required").optional(),
  description: z.string().trim().optional(),
  coverImage: coverImageSchema,
  type: z.enum(["PERSONAL", "STORE"]).optional(),
  visibility: z.enum(["PRIVATE", "SHARED"]).optional()
});

export type KitchenInput = z.input<typeof kitchenInputSchema>;
export type KitchenUpdateInput = z.input<typeof kitchenUpdateInputSchema>;

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
  input: KitchenUpdateInput,
  db: Db = prisma
) {
  const parsed = kitchenUpdateInputSchema.parse(input);
  const data: Prisma.KitchenUpdateInput = {};

  if (parsed.name !== undefined) {
    data.name = parsed.name;
  }

  if (parsed.description !== undefined) {
    data.description = parsed.description;
  }

  if (parsed.coverImage !== undefined) {
    data.coverImage = parsed.coverImage || null;
  }

  if (parsed.type !== undefined) {
    data.type = parsed.type as KitchenType;
  }

  if (parsed.visibility !== undefined) {
    data.visibility = parsed.visibility as Visibility;
  }

  return db.kitchen.update({
    where: { id },
    data
  });
}

export async function deleteKitchen(id: string, db: Db = prisma) {
  return db.kitchen.delete({
    where: { id }
  });
}

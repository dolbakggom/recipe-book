import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient, ShareLink } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const shareLinkInputSchema = z.object({
  type: z.enum(["RECIPE", "KITCHEN"]),
  targetId: z.string().trim().min(1, "Share target is required"),
  expiresAt: z.date().nullable().optional()
});

export type ShareLinkInput = z.input<typeof shareLinkInputSchema>;

const recipeShareInclude = {
  kitchen: true,
  recipeIngredients: {
    orderBy: { order: "asc" },
    include: { ingredient: true }
  },
  steps: {
    orderBy: { order: "asc" }
  }
} satisfies Prisma.RecipeInclude;

const kitchenShareInclude = {
  recipes: {
    orderBy: { updatedAt: "desc" },
    include: {
      recipeIngredients: {
        take: 4,
        orderBy: { order: "asc" },
        include: { ingredient: true }
      }
    }
  }
} satisfies Prisma.KitchenInclude;

type RecipeShare = Prisma.RecipeGetPayload<{
  include: typeof recipeShareInclude;
}>;
type KitchenShare = Prisma.KitchenGetPayload<{
  include: typeof kitchenShareInclude;
}>;

export type ShareLinkResolution =
  | {
      share: ShareLink;
      expired: true;
      recipe: null;
      kitchen: null;
    }
  | {
      share: ShareLink;
      expired: false;
      recipe: RecipeShare | null;
      kitchen: null;
    }
  | {
      share: ShareLink;
      expired: false;
      recipe: null;
      kitchen: KitchenShare | null;
    };

export type SharedKitchenRecipeResolution =
  | {
      share: ShareLink;
      expired: true;
      recipe: null;
      kitchen: null;
    }
  | {
      share: ShareLink;
      expired: false;
      recipe: RecipeShare;
      kitchen: RecipeShare["kitchen"];
    };

export async function createShareLink(
  input: ShareLinkInput,
  db: Db = prisma
) {
  const parsed = shareLinkInputSchema.parse(input);
  await assertShareTargetExists(parsed.type, parsed.targetId, db);

  return db.shareLink.create({
    data: {
      type: parsed.type,
      targetId: parsed.targetId,
      token: randomUUID().replaceAll("-", ""),
      permission: "VIEW",
      expiresAt: parsed.expiresAt ?? null
    }
  });
}

export async function resolveShareLink(
  token: string,
  db: Db = prisma
): Promise<ShareLinkResolution | null> {
  const share = await db.shareLink.findUnique({
    where: { token }
  });

  if (!share) {
    return null;
  }

  if (share.expiresAt && share.expiresAt <= new Date()) {
    return {
      share,
      expired: true,
      recipe: null,
      kitchen: null
    };
  }

  if (share.type === "RECIPE") {
    const recipe = await db.recipe.findUnique({
      where: { id: share.targetId },
      include: recipeShareInclude
    });

    return {
      share,
      expired: false,
      recipe,
      kitchen: null
    };
  }

  const kitchen = await db.kitchen.findUnique({
    where: { id: share.targetId },
    include: kitchenShareInclude
  });

  return {
    share,
    expired: false,
    recipe: null,
    kitchen
  };
}

export async function resolveSharedKitchenRecipe(
  token: string,
  recipeId: string,
  db: Db = prisma
): Promise<SharedKitchenRecipeResolution | null> {
  const share = await db.shareLink.findUnique({
    where: { token }
  });

  if (!share || share.type !== "KITCHEN") {
    return null;
  }

  if (share.expiresAt && share.expiresAt <= new Date()) {
    return {
      share,
      expired: true,
      recipe: null,
      kitchen: null
    };
  }

  const recipe = await db.recipe.findFirst({
    where: {
      id: recipeId,
      kitchenId: share.targetId
    },
    include: recipeShareInclude
  });

  if (!recipe) {
    return null;
  }

  return {
    share,
    expired: false,
    recipe,
    kitchen: recipe.kitchen
  };
}

async function assertShareTargetExists(
  type: ShareLinkInput["type"],
  targetId: string,
  db: Db
) {
  const target =
    type === "RECIPE"
      ? await db.recipe.findUnique({
          where: { id: targetId },
          select: { id: true }
        })
      : await db.kitchen.findUnique({
          where: { id: targetId },
          select: { id: true }
        });

  if (!target) {
    throw new Error("Share target was not found");
  }
}

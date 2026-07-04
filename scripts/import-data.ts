import { readFileSync } from "node:fs";
import path from "node:path";
import {
  KitchenType,
  PrismaClient,
  SharePermission,
  ShareTargetType,
  Visibility
} from "@prisma/client";

type ExportPayload = {
  tables: {
    kitchens: Array<Record<string, unknown>>;
    recipes: Array<Record<string, unknown>>;
    ingredients: Array<Record<string, unknown>>;
    recipeIngredients: Array<Record<string, unknown>>;
    recipeSteps: Array<Record<string, unknown>>;
    shareLinks: Array<Record<string, unknown>>;
  };
};

const args = process.argv.slice(2);
const inputPath = path.resolve(readOption("--input") ?? "tmp/recipe-book-data.json");
const imageMapPath = readOption("--image-map");
const shouldReplace = args.includes("--replace");

const payload = JSON.parse(readFileSync(inputPath, "utf8")) as ExportPayload;
const imageMap = imageMapPath
  ? (JSON.parse(readFileSync(path.resolve(imageMapPath), "utf8")) as Record<
      string,
      string
    >)
  : {};

const prisma = new PrismaClient();

async function main() {
  if (shouldReplace) {
    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany(),
      prisma.recipeStep.deleteMany(),
      prisma.shareLink.deleteMany(),
      prisma.recipe.deleteMany(),
      prisma.ingredient.deleteMany(),
      prisma.kitchen.deleteMany()
    ]);
  }

  for (const kitchen of payload.tables.kitchens) {
    const data = {
      id: text(kitchen.id),
      name: text(kitchen.name),
      description: text(kitchen.description),
      coverImage: remapImage(nullableText(kitchen.coverImage)),
      ownerTokenHash: nullableText(kitchen.ownerTokenHash),
      type: enumValue(kitchen.type, KitchenType, "PERSONAL"),
      visibility: enumValue(kitchen.visibility, Visibility, "PRIVATE"),
      createdAt: dateValue(kitchen.createdAt),
      updatedAt: dateValue(kitchen.updatedAt)
    };

    await prisma.kitchen.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  for (const ingredient of payload.tables.ingredients) {
    const data = {
      id: text(ingredient.id),
      kitchenId: text(ingredient.kitchenId),
      name: text(ingredient.name),
      category: text(ingredient.category),
      defaultUnit: text(ingredient.defaultUnit),
      description: text(ingredient.description),
      allergenInfo: text(ingredient.allergenInfo),
      createdAt: dateValue(ingredient.createdAt),
      updatedAt: dateValue(ingredient.updatedAt)
    };

    await prisma.ingredient.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  for (const recipe of payload.tables.recipes) {
    const data = {
      id: text(recipe.id),
      kitchenId: text(recipe.kitchenId),
      title: text(recipe.title),
      description: text(recipe.description),
      coverImage: remapImage(nullableText(recipe.coverImage)),
      markdownContent: text(recipe.markdownContent),
      createdAt: dateValue(recipe.createdAt),
      updatedAt: dateValue(recipe.updatedAt)
    };

    await prisma.recipe.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  for (const item of payload.tables.recipeIngredients) {
    const data = {
      id: text(item.id),
      recipeId: text(item.recipeId),
      ingredientId: text(item.ingredientId),
      amount: text(item.amount),
      unit: text(item.unit),
      note: text(item.note),
      order: numberValue(item.order)
    };

    await prisma.recipeIngredient.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  for (const step of payload.tables.recipeSteps) {
    const data = {
      id: text(step.id),
      recipeId: text(step.recipeId),
      title: text(step.title),
      description: text(step.description),
      order: numberValue(step.order)
    };

    await prisma.recipeStep.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  for (const shareLink of payload.tables.shareLinks) {
    const data = {
      id: text(shareLink.id),
      type: enumValue(shareLink.type, ShareTargetType, "RECIPE"),
      targetId: text(shareLink.targetId),
      token: text(shareLink.token),
      permission: enumValue(shareLink.permission, SharePermission, "VIEW"),
      expiresAt: nullableDateValue(shareLink.expiresAt),
      createdAt: dateValue(shareLink.createdAt)
    };

    await prisma.shareLink.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  console.log("Imported recipe data");
  console.table({
    kitchens: payload.tables.kitchens.length,
    recipes: payload.tables.recipes.length,
    ingredients: payload.tables.ingredients.length,
    recipeIngredients: payload.tables.recipeIngredients.length,
    recipeSteps: payload.tables.recipeSteps.length,
    shareLinks: payload.tables.shareLinks.length
  });
}

function readOption(name: string) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }

  return value;
}

function remapImage(value: string | null) {
  if (!value) {
    return null;
  }

  return imageMap[value] ?? value;
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function nullableText(value: unknown) {
  return value == null || value === "" ? null : String(value);
}

function numberValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: unknown) {
  return nullableDateValue(value) ?? new Date();
}

function nullableDateValue(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return new Date(numericValue);
  }

  return new Date(String(value));
}

function enumValue<T extends Record<string, string>>(
  value: unknown,
  enumObject: T,
  fallback: T[keyof T]
) : T[keyof T] {
  const candidate = String(value ?? "") as T[keyof T];
  return Object.values(enumObject).includes(candidate) ? candidate : fallback;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

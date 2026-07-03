import { describe, expect, it } from "vitest";
import { createIngredient } from "@/features/ingredients/data";
import { createKitchen } from "@/features/kitchens/data";
import {
  createRecipe,
  getRecipeDetail,
  updateRecipe
} from "@/features/recipes/data";
import { withTestDb } from "./helpers/test-db";

describe("recipe data", () => {
  it("creates a recipe with ordered ingredient blocks and steps", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Prep Kitchen" }, db);
      const sauce = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Soy sauce",
          defaultUnit: "tbsp"
        },
        db
      );
      const rice = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Rice",
          defaultUnit: "cup"
        },
        db
      );

      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "  Soy Rice  ",
          description: "  Weeknight bowl  ",
          markdownContent: "  ## Notes\nKeep it hot.  ",
          ingredients: [
            {
              ingredientId: sauce.id,
              amount: "2",
              unit: "tbsp",
              note: "finish",
              order: 2
            },
            {
              ingredientId: rice.id,
              amount: "1",
              unit: "cup",
              note: "warm",
              order: 1
            }
          ],
          steps: [
            {
              title: "Sauce",
              description: "Stir sauce together.",
              order: 2
            },
            {
              title: "Rice",
              description: "Cook rice until fluffy.",
              order: 1
            }
          ]
        },
        db
      );

      const detail = await getRecipeDetail(recipe.id, db);

      expect(detail?.title).toBe("Soy Rice");
      expect(detail?.description).toBe("Weeknight bowl");
      expect(detail?.markdownContent).toBe("## Notes\nKeep it hot.");
      expect(
        detail?.recipeIngredients.map((item) => ({
          ingredientName: item.ingredient.name,
          amount: item.amount,
          unit: item.unit,
          note: item.note,
          order: item.order
        }))
      ).toEqual([
        {
          ingredientName: "Rice",
          amount: "1",
          unit: "cup",
          note: "warm",
          order: 1
        },
        {
          ingredientName: "Soy sauce",
          amount: "2",
          unit: "tbsp",
          note: "finish",
          order: 2
        }
      ]);
      expect(
        detail?.steps.map((step) => ({
          title: step.title,
          description: step.description,
          order: step.order
        }))
      ).toEqual([
        {
          title: "Rice",
          description: "Cook rice until fluffy.",
          order: 1
        },
        {
          title: "Sauce",
          description: "Stir sauce together.",
          order: 2
        }
      ]);
    });
  });

  it("replaces recipe ingredient rows when updating", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Update Kitchen" }, db);
      const garlic = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Garlic",
          defaultUnit: "clove"
        },
        db
      );
      const onion = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Onion",
          defaultUnit: "each"
        },
        db
      );
      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "Aromatics",
          ingredients: [
            {
              ingredientId: garlic.id,
              amount: "3",
              unit: "cloves",
              note: "minced",
              order: 1
            }
          ],
          steps: [
            {
              title: "Mince",
              description: "Mince garlic.",
              order: 1
            }
          ]
        },
        db
      );

      await updateRecipe(
        recipe.id,
        {
          kitchenId: kitchen.id,
          title: "Onion Base",
          ingredients: [
            {
              ingredientId: onion.id,
              amount: "1",
              unit: "each",
              note: "sliced",
              order: 1
            }
          ],
          steps: [
            {
              title: "Slice",
              description: "Slice onion thinly.",
              order: 1
            }
          ]
        },
        db
      );

      const detail = await getRecipeDetail(recipe.id, db);
      const ingredientRows = await db.recipeIngredient.findMany({
        where: { recipeId: recipe.id },
        include: { ingredient: true }
      });

      expect(ingredientRows).toHaveLength(1);
      expect(detail?.recipeIngredients.map((item) => item.ingredient.name)).toEqual([
        "Onion"
      ]);
      expect(detail?.steps.map((step) => step.title)).toEqual(["Slice"]);
    });
  });

  it("rejects creating recipe links to ingredients from another kitchen", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Kitchen A" }, db);
      const otherKitchen = await createKitchen({ name: "Kitchen B" }, db);
      const outsideIngredient = await createIngredient(
        {
          kitchenId: otherKitchen.id,
          name: "Outside Salt"
        },
        db
      );

      await expect(
        createRecipe(
          {
            kitchenId: kitchen.id,
            title: "Boundary Soup",
            ingredients: [
              {
                ingredientId: outsideIngredient.id,
                order: 1
              }
            ]
          },
          db
        )
      ).rejects.toThrow("Recipe ingredients must belong to the same kitchen");
    });
  });

  it("rejects updating recipe links to ingredients from another kitchen", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Kitchen A" }, db);
      const otherKitchen = await createKitchen({ name: "Kitchen B" }, db);
      const insideIngredient = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Inside Salt"
        },
        db
      );
      const outsideIngredient = await createIngredient(
        {
          kitchenId: otherKitchen.id,
          name: "Outside Salt"
        },
        db
      );
      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "Boundary Soup",
          ingredients: [
            {
              ingredientId: insideIngredient.id,
              order: 1
            }
          ]
        },
        db
      );

      await expect(
        updateRecipe(
          recipe.id,
          {
            kitchenId: kitchen.id,
            title: "Boundary Soup",
            ingredients: [
              {
                ingredientId: outsideIngredient.id,
                order: 1
              }
            ]
          },
          db
        )
      ).rejects.toThrow("Recipe ingredients must belong to the same kitchen");

      const detail = await getRecipeDetail(recipe.id, db);
      expect(detail?.recipeIngredients.map((item) => item.ingredient.name)).toEqual([
        "Inside Salt"
      ]);
    });
  });

  it("accepts a Vercel Blob recipe cover image", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Image Kitchen" }, db);

      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "Cloud Image",
          coverImage:
            "https://abc123.public.blob.vercel-storage.com/uploads/cover.png"
        },
        db
      );

      expect(recipe.coverImage).toBe(
        "https://abc123.public.blob.vercel-storage.com/uploads/cover.png"
      );
    });
  });

  it("rejects creating a recipe with an unsupported cover image URL", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Image Kitchen" }, db);

      await expect(
        createRecipe(
          {
            kitchenId: kitchen.id,
            title: "Unsafe Image",
            coverImage: "https://example.com/bad.png"
          },
          db
        )
      ).rejects.toThrow("Cover image must be a saved upload URL");
    });
  });

  it("rejects updating to an invalid cover image and preserves existing data", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Image Update Kitchen" }, db);
      const salt = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Salt"
        },
        db
      );
      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "Valid Image",
          coverImage: "/uploads/123e4567-e89b-12d3-a456-426614174000.png",
          ingredients: [
            {
              ingredientId: salt.id,
              amount: "1",
              unit: "tsp",
              note: "keep",
              order: 1
            }
          ],
          steps: [
            {
              title: "Season",
              description: "Season to taste.",
              order: 1
            }
          ]
        },
        db
      );

      await expect(
        updateRecipe(
          recipe.id,
          {
            kitchenId: kitchen.id,
            title: "Invalid Image",
            coverImage: "javascript:alert(1)",
            ingredients: [],
            steps: []
          },
          db
        )
      ).rejects.toThrow("Cover image must be a saved upload URL");

      const detail = await getRecipeDetail(recipe.id, db);
      expect(detail?.coverImage).toBe(
        "/uploads/123e4567-e89b-12d3-a456-426614174000.png"
      );
      expect(detail?.title).toBe("Valid Image");
      expect(detail?.recipeIngredients.map((item) => item.ingredient.name)).toEqual([
        "Salt"
      ]);
      expect(detail?.steps.map((step) => step.title)).toEqual(["Season"]);
    });
  });
});

import { describe, expect, it } from "vitest";
import { createIngredient } from "@/features/ingredients/data";
import { createKitchen } from "@/features/kitchens/data";
import { createRecipe } from "@/features/recipes/data";
import {
  createShareLink,
  resolveShareLink
} from "@/features/shares/data";
import { withTestDb } from "./helpers/test-db";

describe("share data", () => {
  it("creates and resolves a recipe share link", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Shared Kitchen" }, db);
      const flour = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Flour",
          defaultUnit: "g"
        },
        db
      );
      const butter = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "Butter",
          defaultUnit: "g"
        },
        db
      );
      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "Pancakes",
          description: "Weekend breakfast",
          markdownContent: "## Notes\nServe hot.",
          ingredients: [
            {
              ingredientId: butter.id,
              amount: "20",
              unit: "g",
              order: 2
            },
            {
              ingredientId: flour.id,
              amount: "100",
              unit: "g",
              order: 1
            }
          ],
          steps: [
            {
              title: "Cook",
              description: "Cook until golden.",
              order: 2
            },
            {
              title: "Mix",
              description: "Mix everything.",
              order: 1
            }
          ]
        },
        db
      );

      const share = await createShareLink(
        { type: "RECIPE", targetId: recipe.id },
        db
      );
      const resolved = await resolveShareLink(share.token, db);

      expect(share.token).toMatch(/^[0-9a-f]{32}$/);
      expect(share.permission).toBe("VIEW");
      expect(share.expiresAt).toBeNull();
      expect(resolved?.expired).toBe(false);
      expect(resolved?.share.id).toBe(share.id);
      expect(resolved?.kitchen).toBeNull();
      expect(resolved?.recipe?.title).toBe("Pancakes");
      expect(resolved?.recipe?.kitchen.name).toBe("Shared Kitchen");
      expect(
        resolved?.recipe?.recipeIngredients.map((item) => item.ingredient.name)
      ).toEqual(["Flour", "Butter"]);
      expect(resolved?.recipe?.steps.map((step) => step.title)).toEqual([
        "Mix",
        "Cook"
      ]);
    });
  });

  it("rejects expired share links", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Archive Kitchen" }, db);
      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "Expired Soup"
        },
        db
      );
      const share = await createShareLink(
        {
          type: "RECIPE",
          targetId: recipe.id,
          expiresAt: new Date(Date.now() - 60_000)
        },
        db
      );

      const resolved = await resolveShareLink(share.token, db);

      expect(resolved).toEqual({
        share,
        expired: true,
        recipe: null,
        kitchen: null
      });
    });
  });

  it("resolves a kitchen share link with its recipes", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen(
        {
          name: "Menu Kitchen",
          description: "Shared menu"
        },
        db
      );
      const ingredients = await Promise.all(
        ["Noodle", "Broth", "Egg", "Scallion", "Garlic"].map((name) =>
          createIngredient({ kitchenId: kitchen.id, name }, db)
        )
      );
      await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "Ramen",
          description: "Fast bowl",
          ingredients: ingredients.map((ingredient, index) => ({
            ingredientId: ingredient.id,
            order: index + 1
          }))
        },
        db
      );

      const share = await createShareLink(
        { type: "KITCHEN", targetId: kitchen.id },
        db
      );
      const resolved = await resolveShareLink(share.token, db);

      expect(resolved?.expired).toBe(false);
      expect(resolved?.recipe).toBeNull();
      expect(resolved?.kitchen?.name).toBe("Menu Kitchen");
      expect(resolved?.kitchen?.recipes.map((recipe) => recipe.title)).toEqual([
        "Ramen"
      ]);
      expect(
        resolved?.kitchen?.recipes[0].recipeIngredients.map(
          (item) => item.ingredient.name
        )
      ).toEqual(["Noodle", "Broth", "Egg", "Scallion"]);
    });
  });

  it("returns null for a missing share token", async () => {
    await withTestDb(async (db) => {
      await expect(resolveShareLink("missing-token", db)).resolves.toBeNull();
    });
  });

  it("rejects share links for missing targets", async () => {
    await withTestDb(async (db) => {
      await expect(
        createShareLink({ type: "RECIPE", targetId: "missing-recipe" }, db)
      ).rejects.toThrow("Share target was not found");
      await expect(
        createShareLink({ type: "KITCHEN", targetId: "missing-kitchen" }, db)
      ).rejects.toThrow("Share target was not found");
    });
  });
});

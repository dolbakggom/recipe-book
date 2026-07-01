import { describe, expect, it } from "vitest";
import { createKitchen } from "@/features/kitchens/data";
import {
  createIngredient,
  getIngredientWithRecipes,
  listIngredients
} from "@/features/ingredients/data";
import { withTestDb } from "./helpers/test-db";

describe("ingredient data", () => {
  it("creates ingredients per kitchen and lists them by kitchen", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "My Kitchen" }, db);
      await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "고추장",
          category: "Sauce",
          defaultUnit: "tbsp",
          description: "매운 양념",
          allergenInfo: ""
        },
        db
      );

      const ingredients = await listIngredients({ kitchenId: kitchen.id }, db);
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name).toBe("고추장");
    });
  });

  it("shows recipes connected to an ingredient", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Store Kitchen" }, db);
      const ingredient = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "간장",
          category: "Sauce",
          defaultUnit: "ml",
          description: "",
          allergenInfo: "대두"
        },
        db
      );
      const recipe = await db.recipe.create({
        data: {
          kitchenId: kitchen.id,
          title: "간장 닭갈비",
          recipeIngredients: {
            create: {
              ingredientId: ingredient.id,
              amount: "60",
              unit: "ml",
              order: 1
            }
          }
        }
      });

      const detail = await getIngredientWithRecipes(ingredient.id, db);
      expect(detail?.recipeIngredients).toHaveLength(1);
      expect(detail?.recipeIngredients[0].recipe.title).toBe(recipe.title);
    });
  });
});

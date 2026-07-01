import { describe, expect, it } from "vitest";
import { createKitchen } from "@/features/kitchens/data";
import {
  createIngredient,
  deleteIngredient,
  getIngredientWithRecipes,
  listIngredients,
  updateIngredient
} from "@/features/ingredients/data";
import { withTestDb } from "./helpers/test-db";

describe("ingredient data", () => {
  it("creates ingredients per kitchen and lists them by kitchen", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "My Kitchen" }, db);
      const otherKitchen = await createKitchen({ name: "Other Kitchen" }, db);
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
      await createIngredient(
        {
          kitchenId: otherKitchen.id,
          name: "된장",
          category: "Sauce",
          defaultUnit: "tbsp",
          description: "구수한 양념",
          allergenInfo: ""
        },
        db
      );

      const ingredients = await listIngredients({ kitchenId: kitchen.id }, db);
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name).toBe("고추장");
      expect(ingredients.map((ingredient) => ingredient.kitchenId)).toEqual([
        kitchen.id
      ]);
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

  it("rejects deleting an ingredient used by recipes", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Linked Kitchen" }, db);
      const ingredient = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "참기름",
          category: "Oil",
          defaultUnit: "tbsp",
          description: "",
          allergenInfo: "참깨"
        },
        db
      );
      await db.recipe.create({
        data: {
          kitchenId: kitchen.id,
          title: "참기름 비빔밥",
          recipeIngredients: {
            create: {
              ingredientId: ingredient.id,
              amount: "1",
              unit: "tbsp",
              order: 1
            }
          }
        }
      });

      await expect(deleteIngredient(ingredient.id, db)).rejects.toThrow(
        "Ingredient is used by recipes"
      );
    });
  });

  it("rejects moving a used ingredient to another kitchen", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Kitchen A" }, db);
      const otherKitchen = await createKitchen({ name: "Kitchen B" }, db);
      const ingredient = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "마늘",
          category: "Vegetable",
          defaultUnit: "clove",
          description: "",
          allergenInfo: ""
        },
        db
      );
      await db.recipe.create({
        data: {
          kitchenId: kitchen.id,
          title: "마늘 볶음밥",
          recipeIngredients: {
            create: {
              ingredientId: ingredient.id,
              amount: "3",
              unit: "cloves",
              order: 1
            }
          }
        }
      });

      await expect(
        updateIngredient(
          ingredient.id,
          {
            kitchenId: otherKitchen.id,
            name: "다진 마늘",
            category: "Vegetable",
            defaultUnit: "clove",
            description: "잘게 다진 마늘",
            allergenInfo: ""
          },
          db
        )
      ).rejects.toThrow("Ingredient kitchen cannot change while used by recipes");
    });
  });
});

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const kitchen = await db.kitchen.upsert({
    where: { id: "seed-kitchen" },
    update: {},
    create: {
      id: "seed-kitchen",
      name: "My Kitchen",
      description: "Local sample recipe book",
      type: "PERSONAL"
    }
  });

  const gochujang = await db.ingredient.upsert({
    where: {
      kitchenId_name: {
        kitchenId: kitchen.id,
        name: "고추장"
      }
    },
    update: {},
    create: {
      kitchenId: kitchen.id,
      name: "고추장",
      category: "Sauce",
      defaultUnit: "tbsp",
      description: "매콤한 한식 양념장"
    }
  });

  const recipe = await db.recipe.upsert({
    where: { id: "seed-recipe" },
    update: {},
    create: {
      id: "seed-recipe",
      kitchenId: kitchen.id,
      title: "제육볶음",
      description: "고추장 양념 돼지고기 볶음",
      markdownContent: "## 조리 메모\n\n- 센 불에서 빠르게 볶기\n- 양파는 마지막에 넣기"
    }
  });

  await db.recipeIngredient.upsert({
    where: {
      recipeId_ingredientId: {
        recipeId: recipe.id,
        ingredientId: gochujang.id
      }
    },
    update: {
      amount: "2",
      unit: "tbsp",
      note: "양념 베이스",
      order: 1
    },
    create: {
      recipeId: recipe.id,
      ingredientId: gochujang.id,
      amount: "2",
      unit: "tbsp",
      note: "양념 베이스",
      order: 1
    }
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });

import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageField } from "@/components/ImageField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createRecipeAction } from "@/features/recipes/actions";
import { listIngredients } from "@/features/ingredients/data";
import { getKitchen } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

type NewRecipePageProps = {
  params: Promise<{ id: string }>;
};

type IngredientOption = Awaited<ReturnType<typeof listIngredients>>[number];

const ingredientRows = Array.from({ length: 5 }, (_, index) => index);
const stepRows = Array.from({ length: 4 }, (_, index) => index);

export default async function NewRecipePage({ params }: NewRecipePageProps) {
  const { id } = await params;
  const kitchen = await getKitchen(id);

  if (!kitchen) {
    notFound();
  }

  const ingredients = await listIngredients({ kitchenId: kitchen.id });

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{kitchen.name}</p>
        <h1 className="page-title">New Recipe</h1>
        <p className="muted">Kitchen에 저장할 레시피와 조리 순서를 작성합니다.</p>
        <div className="button-row">
          <Link href={paths.kitchen(kitchen.id)} className="button secondary">
            Back to Kitchen
          </Link>
          <Link href={paths.ingredients(kitchen.id)} className="button secondary">
            Ingredients
          </Link>
        </div>
      </section>

      <form action={createRecipeAction} className="form">
        <input name="kitchenId" type="hidden" value={kitchen.id} />
        <ImageField />

        <div className="field">
          <label htmlFor="title">레시피 이름</label>
          <input className="input" id="title" name="title" required />
        </div>

        <div className="field">
          <label htmlFor="description">간단 설명</label>
          <textarea className="textarea" id="description" name="description" />
        </div>

        <section className="stack">
          <h2>Ingredient Blocks</h2>
          {ingredients.length === 0 && (
            <div className="field">
              <p className="muted">
                이 Kitchen에는 아직 재료가 없습니다. 레시피는 먼저 저장할 수 있고,
                재료는 Ingredient 페이지에서 추가할 수 있습니다.
              </p>
              <div className="button-row">
                <Link
                  href={paths.ingredients(kitchen.id)}
                  className="button secondary"
                >
                  Manage Ingredients
                </Link>
              </div>
            </div>
          )}
          {ingredientRows.map((row) => (
            <IngredientRow
              ingredients={ingredients}
              key={row}
              rowNumber={row + 1}
            />
          ))}
        </section>

        <section className="stack">
          <h2>Steps</h2>
          {stepRows.map((row) => (
            <StepRow key={row} rowNumber={row + 1} />
          ))}
        </section>

        <div className="field">
          <label htmlFor="markdownContent">Markdown Notes</label>
          <textarea
            className="textarea"
            id="markdownContent"
            name="markdownContent"
          />
        </div>

        <SubmitButton>
          <Plus size={18} aria-hidden="true" />
          Create Recipe
        </SubmitButton>
      </form>
    </>
  );
}

function IngredientRow({
  ingredients,
  rowNumber
}: {
  ingredients: IngredientOption[];
  rowNumber: number;
}) {
  return (
    <div className="split">
      <div className="field">
        <label htmlFor={`ingredientId-${rowNumber}`}>재료 {rowNumber}</label>
        <select
          className="select"
          id={`ingredientId-${rowNumber}`}
          name="ingredientId"
          defaultValue=""
        >
          <option value="">선택 안 함</option>
          {ingredients.map((ingredient) => (
            <option value={ingredient.id} key={ingredient.id}>
              {ingredient.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`amount-${rowNumber}`}>수량</label>
        <input className="input" id={`amount-${rowNumber}`} name="amount" />
      </div>
      <div className="field">
        <label htmlFor={`unit-${rowNumber}`}>단위</label>
        <input className="input" id={`unit-${rowNumber}`} name="unit" />
      </div>
      <div className="field">
        <label htmlFor={`note-${rowNumber}`}>메모</label>
        <input className="input" id={`note-${rowNumber}`} name="note" />
      </div>
    </div>
  );
}

function StepRow({ rowNumber }: { rowNumber: number }) {
  return (
    <div className="split">
      <div className="field">
        <label htmlFor={`stepTitle-${rowNumber}`}>Step {rowNumber}</label>
        <input
          className="input"
          id={`stepTitle-${rowNumber}`}
          name="stepTitle"
        />
      </div>
      <div className="field">
        <label htmlFor={`stepDescription-${rowNumber}`}>설명</label>
        <textarea
          className="textarea"
          id={`stepDescription-${rowNumber}`}
          name="stepDescription"
        />
      </div>
    </div>
  );
}

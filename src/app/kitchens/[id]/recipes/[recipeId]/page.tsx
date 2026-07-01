import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageField } from "@/components/ImageField";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  deleteRecipeAction,
  updateRecipeAction
} from "@/features/recipes/actions";
import { createRecipeShareAction } from "@/features/shares/actions";
import { getRecipeDetail } from "@/features/recipes/data";
import { listIngredients } from "@/features/ingredients/data";
import { paths } from "@/lib/paths";

type RecipeDetailPageProps = {
  params: Promise<{ id: string; recipeId: string }>;
};

type IngredientOption = Awaited<ReturnType<typeof listIngredients>>[number];

type IngredientRow = {
  ingredientId: string;
  amount: string;
  unit: string;
  note: string;
};

type StepRow = {
  title: string;
  description: string;
};

export default async function RecipeDetailPage({
  params
}: RecipeDetailPageProps) {
  const { id, recipeId } = await params;
  const recipe = await getRecipeDetail(recipeId);

  if (!recipe || recipe.kitchenId !== id) {
    notFound();
  }

  const ingredients = await listIngredients({ kitchenId: id });
  const updateAction = updateRecipeAction.bind(null, recipe.id);
  const deleteAction = deleteRecipeAction.bind(null, recipe.id, id);
  const shareAction = createRecipeShareAction.bind(null, recipe.id);
  const ingredientRows = padRows(
    recipe.recipeIngredients.map((item) => ({
      ingredientId: item.ingredientId,
      amount: item.amount,
      unit: item.unit,
      note: item.note
    })),
    5,
    { ingredientId: "", amount: "", unit: "", note: "" }
  );
  const stepRows = padRows(
    recipe.steps.map((step) => ({
      title: step.title,
      description: step.description
    })),
    4,
    { title: "", description: "" }
  );

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{recipe.kitchen.name}</p>
        <h1 className="page-title">{recipe.title}</h1>
        <p className="muted">{recipe.description || "설명이 없습니다."}</p>
        <div className="button-row">
          <Link href={paths.kitchen(id)} className="button secondary">
            Back to Kitchen
          </Link>
          <Link href={paths.ingredients(id)} className="button secondary">
            Ingredients
          </Link>
        </div>
      </section>

      <section className="split">
        <form action={updateAction} className="form">
          <h2>Edit Recipe</h2>
          <input name="kitchenId" type="hidden" value={id} />
          <input
            name="existingCoverImage"
            type="hidden"
            value={recipe.coverImage ?? ""}
          />
          <ImageField currentImage={recipe.coverImage} />

          <div className="field">
            <label htmlFor="title">레시피 이름</label>
            <input
              className="input"
              id="title"
              name="title"
              defaultValue={recipe.title}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="description">간단 설명</label>
            <textarea
              className="textarea"
              id="description"
              name="description"
              defaultValue={recipe.description}
            />
          </div>

          <section className="stack">
            <h2>Ingredient Blocks</h2>
            {ingredients.length === 0 && (
              <div className="field">
                <p className="muted">
                  이 Kitchen에는 아직 재료가 없습니다. Ingredient 페이지에서
                  재사용할 재료를 먼저 추가할 수 있습니다.
                </p>
                <div className="button-row">
                  <Link href={paths.ingredients(id)} className="button secondary">
                    Manage Ingredients
                  </Link>
                </div>
              </div>
            )}
            {ingredientRows.map((row, index) => (
              <IngredientEditorRow
                ingredients={ingredients}
                key={index}
                row={row}
                rowNumber={index + 1}
              />
            ))}
          </section>

          <section className="stack">
            <h2>Steps</h2>
            {stepRows.map((row, index) => (
              <StepEditorRow key={index} row={row} rowNumber={index + 1} />
            ))}
          </section>

          <div className="field">
            <label htmlFor="markdownContent">Markdown Notes</label>
            <textarea
              className="textarea"
              id="markdownContent"
              name="markdownContent"
              defaultValue={recipe.markdownContent}
            />
          </div>

          <SubmitButton>Save Recipe</SubmitButton>
        </form>

        <aside className="stack">
          <section className="card">
            <h2>Connected Ingredients</h2>
            {recipe.recipeIngredients.length === 0 ? (
              <p className="muted">
                연결된 재료가 없습니다. 왼쪽 폼에서 재료 블록을 선택하면 여기에
                표시됩니다.
              </p>
            ) : (
              <div className="stack">
                {recipe.recipeIngredients.map((item) => (
                  <Link
                    className="field"
                    href={paths.ingredient(item.ingredientId)}
                    key={item.id}
                  >
                    <h3>{item.ingredient.name}</h3>
                    <p className="muted">
                      {formatIngredientAmount(item.amount, item.unit) ||
                        "수량 없음"}
                    </p>
                    {item.note && <span className="tag">{item.note}</span>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Markdown Preview</h2>
            <MarkdownPreview content={recipe.markdownContent} />
          </section>

          <form action={shareAction} className="form">
            <button className="button secondary" type="submit">
              공유 링크 만들기
            </button>
          </form>

          <form action={deleteAction} className="form">
            <h2>Delete Recipe</h2>
            <p className="muted">삭제하면 이 레시피와 연결된 단계가 함께 삭제됩니다.</p>
            <ConfirmSubmitButton message="Delete this recipe?">
              Delete Recipe
            </ConfirmSubmitButton>
          </form>
        </aside>
      </section>
    </>
  );
}

function IngredientEditorRow({
  ingredients,
  row,
  rowNumber
}: {
  ingredients: IngredientOption[];
  row: IngredientRow;
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
          defaultValue={row.ingredientId}
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
        <input
          className="input"
          id={`amount-${rowNumber}`}
          name="amount"
          defaultValue={row.amount}
        />
      </div>
      <div className="field">
        <label htmlFor={`unit-${rowNumber}`}>단위</label>
        <input
          className="input"
          id={`unit-${rowNumber}`}
          name="unit"
          defaultValue={row.unit}
        />
      </div>
      <div className="field">
        <label htmlFor={`note-${rowNumber}`}>메모</label>
        <input
          className="input"
          id={`note-${rowNumber}`}
          name="note"
          defaultValue={row.note}
        />
      </div>
    </div>
  );
}

function StepEditorRow({
  row,
  rowNumber
}: {
  row: StepRow;
  rowNumber: number;
}) {
  return (
    <div className="split">
      <div className="field">
        <label htmlFor={`stepTitle-${rowNumber}`}>Step {rowNumber}</label>
        <input
          className="input"
          id={`stepTitle-${rowNumber}`}
          name="stepTitle"
          defaultValue={row.title}
        />
      </div>
      <div className="field">
        <label htmlFor={`stepDescription-${rowNumber}`}>설명</label>
        <textarea
          className="textarea"
          id={`stepDescription-${rowNumber}`}
          name="stepDescription"
          defaultValue={row.description}
        />
      </div>
    </div>
  );
}

function padRows<T>(rows: T[], minimumLength: number, blankRow: T) {
  if (rows.length >= minimumLength) {
    return rows;
  }

  return [
    ...rows,
    ...Array.from({ length: minimumLength - rows.length }, () => blankRow)
  ];
}

function formatIngredientAmount(amount: string, unit: string) {
  return [amount, unit].filter(Boolean).join(" ");
}

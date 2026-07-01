import Link from "next/link";
import { notFound } from "next/navigation";
import { getIngredientWithRecipes } from "@/features/ingredients/data";
import { paths } from "@/lib/paths";

export default async function IngredientDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ingredient = await getIngredientWithRecipes(id);

  if (!ingredient) {
    notFound();
  }

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{ingredient.kitchen.name}</p>
        <h1 className="page-title">{ingredient.name}</h1>
        <p className="muted">{ingredient.description || "설명이 없습니다."}</p>
      </section>

      <section className="split">
        <article className="card">
          <h2>재료 정보</h2>
          <div className="tag-row">
            {ingredient.category && <span className="tag">{ingredient.category}</span>}
            {ingredient.defaultUnit && (
              <span className="tag">기본 단위 {ingredient.defaultUnit}</span>
            )}
            {ingredient.allergenInfo && (
              <span className="tag">알레르기 {ingredient.allergenInfo}</span>
            )}
          </div>
        </article>

        <section className="grid">
          {ingredient.recipeIngredients.length === 0 ? (
            <article className="card">
              <h2>연결된 레시피가 없습니다</h2>
              <p className="muted">
                이 재료를 사용하는 레시피가 생기면 여기에 표시됩니다.
              </p>
            </article>
          ) : (
            ingredient.recipeIngredients.map((item) => (
              <Link
                className="card"
                href={paths.recipe(item.recipe.kitchenId, item.recipe.id)}
                key={item.id}
              >
                <h2>{item.recipe.title}</h2>
                <p className="muted">
                  {item.recipe.description || item.recipe.kitchen.name}
                </p>
                <span className="tag">
                  {[item.amount, item.unit].filter(Boolean).join(" ") || "수량 없음"}
                </span>
              </Link>
            ))
          )}
        </section>
      </section>
    </>
  );
}

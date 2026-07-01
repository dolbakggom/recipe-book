import { Filter, Plus } from "lucide-react";
import Link from "next/link";
import { createIngredientAction } from "@/features/ingredients/actions";
import { listIngredients } from "@/features/ingredients/data";
import { listKitchens } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

export default async function IngredientsPage({
  searchParams
}: {
  searchParams: Promise<{ kitchenId?: string; q?: string }>;
}) {
  const params = await searchParams;
  const kitchens = await listKitchens();

  if (kitchens.length === 0) {
    return (
      <>
        <section className="page-header">
          <p className="eyebrow">Ingredient blocks</p>
          <h1 className="page-title">Ingredients</h1>
          <p className="muted">재사용 가능한 재료 블록을 관리합니다.</p>
        </section>

        <section className="card">
          <h2>Create a Kitchen first</h2>
          <p className="muted">
            Ingredients belong to a Kitchen. Create one before adding reusable
            ingredient blocks.
          </p>
          <div className="button-row">
            <Link className="button" href={paths.kitchens()}>
              Go to Kitchens
            </Link>
          </div>
        </section>
      </>
    );
  }

  const selectedKitchenId =
    kitchens.find((kitchen) => kitchen.id === params.kitchenId)?.id ?? kitchens[0].id;
  const ingredients = await listIngredients({
    kitchenId: selectedKitchenId,
    query: params.q
  });

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Ingredient blocks</p>
        <h1 className="page-title">Ingredients</h1>
        <p className="muted">재사용 가능한 재료 블록을 관리합니다.</p>
      </section>

      <section className="split">
        <form action={createIngredientAction} className="form">
          <h2>New Ingredient</h2>
          <div className="field">
            <label htmlFor="kitchenId">Kitchen</label>
            <select
              className="select"
              id="kitchenId"
              name="kitchenId"
              defaultValue={selectedKitchenId}
            >
              {kitchens.map((kitchen) => (
                <option value={kitchen.id} key={kitchen.id}>
                  {kitchen.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="name">재료명</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="category">카테고리</label>
            <input className="input" id="category" name="category" />
          </div>
          <div className="field">
            <label htmlFor="defaultUnit">기본 단위</label>
            <input className="input" id="defaultUnit" name="defaultUnit" />
          </div>
          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea className="textarea" id="description" name="description" />
          </div>
          <div className="field">
            <label htmlFor="allergenInfo">알레르기 정보</label>
            <input className="input" id="allergenInfo" name="allergenInfo" />
          </div>
          <button className="button" type="submit">
            <Plus size={18} aria-hidden="true" />
            재료 생성
          </button>
        </form>

        <section className="stack">
          <form action={paths.ingredients()} className="form" method="get">
            <h2>Kitchen filter</h2>
            <div className="field">
              <label htmlFor="filterKitchenId">Kitchen</label>
              <select
                className="select"
                id="filterKitchenId"
                name="kitchenId"
                defaultValue={selectedKitchenId}
              >
                {kitchens.map((kitchen) => (
                  <option value={kitchen.id} key={kitchen.id}>
                    {kitchen.name}
                  </option>
                ))}
              </select>
            </div>
            {params.q && <input name="q" type="hidden" value={params.q} />}
            <button className="button secondary" type="submit">
              <Filter size={18} aria-hidden="true" />
              Apply filter
            </button>
          </form>

          <div className="grid">
            {ingredients.map((ingredient) => (
              <Link
                className="card"
                href={paths.ingredient(ingredient.id)}
                key={ingredient.id}
              >
                <h2>{ingredient.name}</h2>
                <p className="muted">{ingredient.description || "설명이 없습니다."}</p>
                <div className="tag-row">
                  {ingredient.category && (
                    <span className="tag">{ingredient.category}</span>
                  )}
                  {ingredient.defaultUnit && (
                    <span className="tag">{ingredient.defaultUnit}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}

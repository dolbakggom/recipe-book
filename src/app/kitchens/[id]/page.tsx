import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKitchen } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

type KitchenPageProps = {
  params: Promise<{ id: string }>;
};

export default async function KitchenPage({ params }: KitchenPageProps) {
  const { id } = await params;
  const kitchen = await getKitchen(id);

  if (!kitchen) {
    notFound();
  }

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{kitchen.type === "STORE" ? "Store Kitchen" : "Personal Kitchen"}</p>
        <h1 className="page-title">{kitchen.name}</h1>
        <p className="muted">{kitchen.description || "설명이 없습니다."}</p>
        <div className="button-row">
          <Link href={paths.newRecipe(kitchen.id)} className="button">
            <Plus size={18} aria-hidden="true" />
            New Recipe
          </Link>
          <Link href={paths.ingredients(kitchen.id)} className="button secondary">
            Ingredients
          </Link>
        </div>
      </section>

      <section className="grid">
        {kitchen.recipes.length === 0 ? (
          <article className="card">
            <h2>No recipes yet</h2>
            <p className="muted">
              Start this Kitchen by adding the first recipe, then connect reusable
              ingredient blocks as you go.
            </p>
            <div className="button-row">
              <Link href={paths.newRecipe(kitchen.id)} className="button">
                <Plus size={18} aria-hidden="true" />
                Create Recipe
              </Link>
              <Link href={paths.ingredients(kitchen.id)} className="button secondary">
                Manage Ingredients
              </Link>
            </div>
          </article>
        ) : (
          kitchen.recipes.map((recipe) => (
            <Link
              className="card"
              href={paths.recipe(kitchen.id, recipe.id)}
              key={recipe.id}
            >
              {recipe.coverImage && (
                <div className="media">
                  <Image
                    src={recipe.coverImage}
                    alt=""
                    width={800}
                    height={600}
                  />
                </div>
              )}
              <h2>{recipe.title}</h2>
              <p className="muted">{recipe.description || "설명이 없습니다."}</p>
              <div className="tag-row">
                {recipe.recipeIngredients.map((item) => (
                  <span className="tag" key={item.id}>
                    {item.ingredient.name}
                  </span>
                ))}
              </div>
            </Link>
          ))
        )}
      </section>
    </>
  );
}

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
          <Link href={paths.kitchens()} className="button secondary">
            Kitchens
          </Link>
          <Link href={paths.ingredients(kitchen.id)} className="button">
            Ingredients
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>Kitchen Summary</h2>
        <div className="tag-row">
          <span className="tag">{kitchen.visibility === "SHARED" ? "Shared" : "Private"}</span>
          <span className="tag">Recipes {kitchen.recipes.length}</span>
          <span className="tag">Ingredients {kitchen.ingredients.length}</span>
        </div>
      </section>
    </>
  );
}

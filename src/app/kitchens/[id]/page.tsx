import { Plus, Share2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createKitchenShareAction } from "@/features/shares/actions";
import { getKitchen } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

type KitchenPageProps = {
  params: Promise<{ id: string }>;
};

function getGradientFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 30%, 48%), hsl(${h2}, 40%, 36%))`;
}

export default async function KitchenPage({ params }: KitchenPageProps) {
  const { id } = await params;
  const kitchen = await getKitchen(id);

  if (!kitchen) {
    notFound();
  }

  const shareAction = createKitchenShareAction.bind(null, kitchen.id);
  const kitchenGradient = getGradientFromId(kitchen.id);

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <Link href={paths.kitchens()} className="button secondary" style={{ minHeight: "36px", padding: "0 12px", fontSize: "13px" }}>
          <ArrowLeft size={16} />
          모든 주방으로 돌아가기
        </Link>
      </div>

      <section className="page-header" style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius-md)", padding: "32px", border: "1px solid var(--border)", marginBottom: "36px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: kitchenGradient, opacity: 0.08, zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ color: "var(--accent)" }}>
            {kitchen.type === "STORE" ? "매장용 주방" : "개인용 주방"}
          </p>
          <h1 className="page-title" style={{ marginTop: "4px" }}>{kitchen.name}</h1>
          <p className="muted" style={{ fontSize: "16px", marginTop: "8px", maxWidth: "800px" }}>
            {kitchen.description || "설명이 없는 레시피 공간입니다."}
          </p>
          
          <div className="button-row" style={{ marginTop: "24px" }}>
            <form action={shareAction}>
              <button className="button secondary" type="submit">
                <Share2 size={16} aria-hidden="true" />
                주방 공유 링크 생성
              </button>
            </form>
          </div>
        </div>
      </section>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "var(--primary)", margin: 0 }}>
          보관된 레시피 ({kitchen.recipes.length})
        </h2>
      </div>

      <section className="grid">
        {kitchen.recipes.length === 0 ? (
          <article className="card" style={{ gridColumn: "1 / -1", padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "40px" }}>🍳</div>
            <h2>보관된 레시피가 없습니다</h2>
            <p className="muted" style={{ maxWidth: "500px", margin: 0 }}>
              이 주방에 첫 번째 레시피를 추가해 보세요.
              자유롭게 작성하면 재료와 조리법은 자동으로 정리됩니다.
            </p>
          </article>
        ) : (
          kitchen.recipes.map((recipe) => {
            const recipeGradient = getGradientFromId(recipe.id);
            return (
              <Link
                className="card"
                href={paths.recipe(kitchen.id, recipe.id)}
                key={recipe.id}
                style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                {recipe.coverImage ? (
                  <div className="media" style={{ borderRadius: "0", aspectRatio: "16 / 9", border: "none", borderBottom: "1px solid var(--border)", marginBottom: "0" }}>
                    <Image
                      src={recipe.coverImage}
                      alt={recipe.title}
                      width={600}
                      height={400}
                      style={{ transition: "var(--transition)" }}
                    />
                  </div>
                ) : (
                  <div className="media" style={{ borderRadius: "0", aspectRatio: "16 / 9", border: "none", borderBottom: "1px solid var(--border)", background: recipeGradient, marginBottom: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-serif)", fontSize: "32px", fontWeight: "700" }}>
                      {recipe.title[0]}
                    </div>
                  </div>
                )}
                
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--primary)" }}>
                    {recipe.title}
                  </h3>
                  <p className="muted" style={{ margin: 0, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", flex: 1 }}>
                    {recipe.description || "설명이 등록되지 않았습니다."}
                  </p>
                  
                  {recipe.recipeIngredients.length > 0 && (
                    <div className="tag-row" style={{ marginTop: "12px", gap: "4px" }}>
                      {recipe.recipeIngredients.map((item) => (
                        <span className="tag" key={item.id} style={{ fontSize: "11px", height: "24px", padding: "0 8px" }}>
                          {item.ingredient.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </section>

      <Link
        aria-label="새 레시피 작성"
        className="floating-action-button"
        href={paths.newRecipe(kitchen.id)}
      >
        <Plus size={20} aria-hidden="true" />
        새 레시피
      </Link>
    </>
  );
}

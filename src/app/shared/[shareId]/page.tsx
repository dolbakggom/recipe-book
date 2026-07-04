import Image from "next/image";
import { headers } from "next/headers";
import Link from "next/link";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { resolveShareLink } from "@/features/shares/data";
import { CopyShareLink } from "@/components/CopyShareLink";
import { ingredientSummariesFromRecipe } from "@/features/recipes/document";
import { paths } from "@/lib/paths";
import { BookOpen, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

type SharedPageProps = {
  params: Promise<{ shareId: string }>;
};

function getGradientFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 35%, 50%), hsl(${h2}, 45%, 35%))`;
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { shareId } = await params;
  const resolved = await resolveShareLink(shareId);

  if (!resolved) {
    return (
      <div className="shared-page-container" style={{ marginTop: "100px" }}>
        <SharedMessage message="공유 링크를 찾을 수 없거나 올바르지 않습니다." />
      </div>
    );
  }

  if (resolved.expired) {
    return (
      <div className="shared-page-container" style={{ marginTop: "100px" }}>
        <SharedMessage message="해당 공유 링크가 만료되었습니다." />
      </div>
    );
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const shareUrl = `${protocol}://${host}${paths.shared(shareId)}`;

  if (resolved.recipe) {
    const { recipe } = resolved;
    const ingredientSummaries = ingredientSummariesFromRecipe(recipe);

    return (
      <div className="shared-page-container">
        <section className="page-header" style={{ alignItems: "center", textAlign: "center", borderBottomStyle: "solid", borderBottomWidth: "3px" }}>
          <p className="eyebrow" style={{ color: "var(--accent)" }}>공유 레시피</p>
          <h1 className="page-title">{recipe.title}</h1>
          <p className="muted" style={{ fontSize: "16px", marginTop: "8px" }}>
            {recipe.description || "설명이 등록되지 않았습니다."}
          </p>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "24px" }}>
          <CopyShareLink shareUrl={shareUrl} />
        </div>

        <article className="shared-card" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {recipe.coverImage && (
            <div className="media" style={{ width: "100%", aspectRatio: "16 / 9", height: "auto" }}>
              <Image
                src={recipe.coverImage}
                alt={recipe.title}
                width={1000}
                height={562}
                priority
              />
            </div>
          )}

          <section className="stack" style={{ gap: "16px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--primary)", borderBottom: "2px solid var(--primary-light)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Layers size={20} />
              재료 정보
            </h2>
            {ingredientSummaries.length === 0 ? (
              <p className="muted">등록된 재료 정보가 없습니다.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                {ingredientSummaries.map((item) => (
                  <div 
                    key={item.key}
                    style={{ 
                      padding: "12px 16px", 
                      borderRadius: "var(--radius-sm)", 
                      background: "var(--bg)", 
                      border: "1.5px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >
                    <span style={{ fontWeight: "700", color: "var(--primary)", fontSize: "15px" }}>{item.name}</span>
                    {item.amountText && (
                      <span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: "600" }}>
                        {item.amountText}
                      </span>
                    )}
                    {item.note && (
                      <span style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic", marginTop: "2px" }}>
                        ({item.note})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {recipe.markdownContent && (
            <section className="stack" style={{ gap: "16px" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--primary)", borderBottom: "2px solid var(--primary-light)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <BookOpen size={20} />
                레시피 문서
              </h2>
              <div style={{ padding: "20px", background: "var(--bg)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)" }}>
                <MarkdownPreview content={recipe.markdownContent} />
              </div>
            </section>
          )}
        </article>
      </div>
    );
  }

  if (resolved.kitchen) {
    const { kitchen } = resolved;
    return (
      <div className="shared-page-container">
        <section className="page-header" style={{ alignItems: "center", textAlign: "center", borderBottomStyle: "solid", borderBottomWidth: "3px" }}>
          <p className="eyebrow" style={{ color: "var(--accent)" }}>공유 주방</p>
          <h1 className="page-title">{kitchen.name}</h1>
          <p className="muted" style={{ fontSize: "16px", marginTop: "8px" }}>
            {kitchen.description || "설명이 등록되지 않았습니다."}
          </p>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
          <CopyShareLink shareUrl={shareUrl} />
        </div>

        <section className="grid">
          {kitchen.recipes.length === 0 ? (
            <article className="card" style={{ gridColumn: "1 / -1", padding: "48px 20px", textAlign: "center" }}>
              <h2>공유된 레시피가 없습니다.</h2>
              <p className="muted">이 주방에는 아직 공개된 레시피가 없습니다.</p>
            </article>
          ) : (
            kitchen.recipes.map((recipe) => {
              const recipeGradient = getGradientFromId(recipe.id);
              return (
                <Link
                  className="card" 
                  href={paths.sharedKitchenRecipe(shareId, recipe.id)}
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
      </div>
    );
  }

  return (
    <div className="shared-page-container" style={{ marginTop: "100px" }}>
      <SharedMessage message="공유 대상을 찾을 수 없습니다." />
    </div>
  );
}

function SharedMessage({ message }: { message: string }) {
  return (
    <section className="card" style={{ padding: "40px", textAlign: "center", borderTop: "4px solid var(--danger)" }}>
      <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--danger)", margin: 0 }}>{message}</h1>
      <p className="muted" style={{ marginTop: "12px" }}>다시 확인하거나 새로운 링크 생성을 요청해 보세요.</p>
    </section>
  );
}

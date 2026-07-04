import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
import { CopyShareLink } from "@/components/CopyShareLink";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { ingredientSummariesFromRecipe } from "@/features/recipes/document";
import { resolveSharedKitchenRecipe } from "@/features/shares/data";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

type SharedKitchenRecipePageProps = {
  params: Promise<{ shareId: string; recipeId: string }>;
};

export default async function SharedKitchenRecipePage({
  params
}: SharedKitchenRecipePageProps) {
  const { shareId, recipeId } = await params;
  const resolved = await resolveSharedKitchenRecipe(shareId, recipeId);

  if (!resolved) {
    return (
      <div className="shared-page-container" style={{ marginTop: "100px" }}>
        <SharedMessage message="공유된 레시피를 찾을 수 없습니다." />
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

  const { recipe, kitchen } = resolved;
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol =
    host.includes("localhost") || host.includes("127.0.0.1")
      ? "http"
      : "https";
  const shareUrl = `${protocol}://${host}${paths.sharedKitchenRecipe(
    shareId,
    recipeId
  )}`;
  const ingredientSummaries = ingredientSummariesFromRecipe(recipe);

  return (
    <div className="shared-page-container">
      <div style={{ marginBottom: "20px" }}>
        <Link
          className="button secondary"
          href={paths.shared(shareId)}
          style={{ minHeight: "36px", padding: "0 12px", fontSize: "13px" }}
        >
          <ArrowLeft size={16} />
          공유 주방으로 돌아가기
        </Link>
      </div>

      <section
        className="page-header"
        style={{
          alignItems: "center",
          textAlign: "center",
          borderBottomStyle: "solid",
          borderBottomWidth: "3px"
        }}
      >
        <p className="eyebrow" style={{ color: "var(--accent)" }}>
          {kitchen.name}
        </p>
        <h1 className="page-title">{recipe.title}</h1>
        <p className="muted" style={{ fontSize: "16px", marginTop: "8px" }}>
          {recipe.description || "설명이 등록되지 않았습니다."}
        </p>
      </section>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        <CopyShareLink shareUrl={shareUrl} />
      </div>

      <article
        className="shared-card"
        style={{ display: "flex", flexDirection: "column", gap: "32px" }}
      >
        {recipe.coverImage && (
          <div
            className="media"
            style={{ width: "100%", aspectRatio: "16 / 9", height: "auto" }}
          >
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
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "22px",
              color: "var(--primary)",
              borderBottom: "2px solid var(--primary-light)",
              paddingBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: 0
            }}
          >
            <Layers size={20} />
            재료 정보
          </h2>
          {ingredientSummaries.length === 0 ? (
            <p className="muted">등록된 재료 정보가 없습니다.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px"
              }}
            >
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
                  <span
                    style={{
                      fontWeight: "700",
                      color: "var(--primary)",
                      fontSize: "15px"
                    }}
                  >
                    {item.name}
                  </span>
                  {item.amountText && (
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--accent)",
                        fontWeight: "600"
                      }}
                    >
                      {item.amountText}
                    </span>
                  )}
                  {item.note && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        fontStyle: "italic",
                        marginTop: "2px"
                      }}
                    >
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
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "22px",
                color: "var(--primary)",
                borderBottom: "2px solid var(--primary-light)",
                paddingBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: 0
              }}
            >
              <BookOpen size={20} />
              레시피 문서
            </h2>
            <div
              style={{
                padding: "20px",
                background: "var(--bg)",
                borderRadius: "var(--radius-sm)",
                border: "1px dashed var(--border)"
              }}
            >
              <MarkdownPreview content={recipe.markdownContent} />
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function SharedMessage({ message }: { message: string }) {
  return (
    <section
      className="card"
      style={{
        padding: "40px",
        textAlign: "center",
        borderTop: "4px solid var(--danger)"
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--danger)",
          margin: 0
        }}
      >
        {message}
      </h1>
      <p className="muted" style={{ marginTop: "12px" }}>
        다시 확인하거나 새로운 링크 생성을 요청해 보세요.
      </p>
    </section>
  );
}

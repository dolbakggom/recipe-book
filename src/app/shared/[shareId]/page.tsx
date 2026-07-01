import Image from "next/image";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { resolveShareLink } from "@/features/shares/data";

type SharedPageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function SharedPage({ params }: SharedPageProps) {
  const { shareId } = await params;
  const resolved = await resolveShareLink(shareId);

  if (!resolved) {
    return <SharedMessage message="공유 링크를 찾을 수 없습니다." />;
  }

  if (resolved.expired) {
    return <SharedMessage message="공유 링크가 만료되었습니다." />;
  }

  if (resolved.recipe) {
    return (
      <>
        <section className="page-header">
          <p className="eyebrow">Shared Recipe</p>
          <h1 className="page-title">{resolved.recipe.title}</h1>
          <p className="muted">
            {resolved.recipe.description || "설명이 없습니다."}
          </p>
        </section>

        <article className="card">
          {resolved.recipe.coverImage && (
            <div className="media">
              <Image
                src={resolved.recipe.coverImage}
                alt=""
                width={1000}
                height={750}
              />
            </div>
          )}

          <section className="stack">
            <h2>Ingredients</h2>
            {resolved.recipe.recipeIngredients.length === 0 ? (
              <p className="muted">등록된 재료가 없습니다.</p>
            ) : (
              <div className="tag-row">
                {resolved.recipe.recipeIngredients.map((item) => (
                  <span className="tag" key={item.id}>
                    {[item.ingredient.name, formatAmount(item.amount, item.unit)]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="stack">
            <h2>Steps</h2>
            {resolved.recipe.steps.length === 0 ? (
              <p className="muted">등록된 단계가 없습니다.</p>
            ) : (
              <ol className="stack">
                {resolved.recipe.steps.map((step) => (
                  <li key={step.id}>
                    <strong>{step.title || "Step"}</strong>
                    {step.description && <p>{step.description}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="stack">
            <h2>Notes</h2>
            <MarkdownPreview content={resolved.recipe.markdownContent} />
          </section>
        </article>
      </>
    );
  }

  if (resolved.kitchen) {
    return (
      <>
        <section className="page-header">
          <p className="eyebrow">Shared Kitchen</p>
          <h1 className="page-title">{resolved.kitchen.name}</h1>
          <p className="muted">
            {resolved.kitchen.description || "설명이 없습니다."}
          </p>
        </section>

        <section className="grid">
          {resolved.kitchen.recipes.length === 0 ? (
            <article className="card">
              <h2>공유된 레시피가 없습니다.</h2>
              <p className="muted">이 Kitchen에는 아직 레시피가 없습니다.</p>
            </article>
          ) : (
            resolved.kitchen.recipes.map((recipe) => (
              <article className="card" key={recipe.id}>
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
              </article>
            ))
          )}
        </section>
      </>
    );
  }

  return <SharedMessage message="공유 대상을 찾을 수 없습니다." />;
}

function SharedMessage({ message }: { message: string }) {
  return (
    <section className="card">
      <h1>{message}</h1>
    </section>
  );
}

function formatAmount(amount: string, unit: string) {
  return [amount, unit].filter(Boolean).join(" ");
}

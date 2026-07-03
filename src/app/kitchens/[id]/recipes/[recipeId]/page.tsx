import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AiRecipeAssistant } from "@/components/AiRecipeAssistant";
import { ImageField } from "@/components/ImageField";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { CopyShareLink } from "@/components/CopyShareLink";
import {
  deleteRecipeAction,
  updateRecipeAction
} from "@/features/recipes/actions";
import { createRecipeShareAction } from "@/features/shares/actions";
import { getRecipeDetail } from "@/features/recipes/data";
import { paths } from "@/lib/paths";
import { prisma } from "@/lib/db";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

type RecipeDetailPageProps = {
  params: Promise<{ id: string; recipeId: string }>;
};

export default async function RecipeDetailPage({
  params
}: RecipeDetailPageProps) {
  const { id, recipeId } = await params;
  const recipe = await getRecipeDetail(recipeId);

  if (!recipe || recipe.kitchenId !== id) {
    notFound();
  }

  const updateAction = updateRecipeAction.bind(null, recipe.id);
  const deleteAction = deleteRecipeAction.bind(null, recipe.id, id);
  const shareAction = createRecipeShareAction.bind(null, recipe.id);

  // Fetch existing share link if any
  const existingShare = await prisma.shareLink.findFirst({
    where: {
      type: "RECIPE",
      targetId: recipe.id
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  let shareUrl = "";
  if (existingShare) {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    shareUrl = `${protocol}://${host}${paths.shared(existingShare.token)}`;
  }

  const initialAiDraft = [
    recipe.title,
    recipe.description,
    recipe.markdownContent
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <Link href={paths.kitchen(id)} className="button secondary" style={{ minHeight: "36px", padding: "0 12px", fontSize: "13px" }}>
          <ArrowLeft size={16} />
          주방({recipe.kitchen.name})으로 돌아가기
        </Link>
      </div>

      <section className="page-header" style={{ marginBottom: "36px" }}>
        <p className="eyebrow">{recipe.kitchen.name}</p>
        <h1 className="page-title">{recipe.title}</h1>
        <p className="muted" style={{ fontSize: "16px", marginTop: "4px" }}>
          {recipe.description || "설명이 등록되지 않았습니다."}
        </p>
      </section>

      <section className="split">
        <form action={updateAction} className="form" style={{ gap: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--primary-light)", paddingBottom: "10px" }}>
            <h2 style={{ border: "none", margin: 0, padding: 0 }}>레시피 수정</h2>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "600" }}>수정 후 반드시 저장 버튼을 눌러주세요.</span>
          </div>

          <input name="kitchenId" type="hidden" value={id} />
          <input
            name="existingCoverImage"
            type="hidden"
            value={recipe.coverImage ?? ""}
          />
          
          <div style={{ padding: "20px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg)" }}>
            <ImageField currentImage={recipe.coverImage} />
          </div>

          <AiRecipeAssistant initialDraft={initialAiDraft} />

          <div className="field">
            <label htmlFor="title">레시피 이름</label>
            <input
              className="input"
              id="title"
              name="title"
              defaultValue={recipe.title}
              placeholder="분석 결과가 자동으로 채워지며 직접 수정할 수 있습니다."
            />
          </div>

          <div className="field">
            <label htmlFor="description">간단 설명</label>
            <textarea
              className="textarea"
              id="description"
              name="description"
              defaultValue={recipe.description}
              placeholder="이 레시피의 요약이나 핵심 특징을 입력하세요."
            />
          </div>

          <div className="field">
            <label htmlFor="markdownContent">레시피 문서</label>
            <textarea
              className="textarea"
              id="markdownContent"
              name="markdownContent"
              defaultValue={recipe.markdownContent}
              placeholder="분석을 실행하면 정리된 문서가 자동으로 채워집니다."
              style={{ minHeight: "180px" }}
            />
          </div>

          <SubmitButton>수정 저장</SubmitButton>
        </form>

        <aside className="stack" style={{ position: "sticky", top: "100px" }}>
          {shareUrl && (
            <CopyShareLink shareUrl={shareUrl} />
          )}

          <section className="card" style={{ gap: "12px" }}>
            <h2 style={{ fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={20} />
              문서 보기
            </h2>
            <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "var(--radius-sm)", background: "var(--bg)", minHeight: "100px", maxHeight: "350px", overflowY: "auto" }}>
              <MarkdownPreview content={recipe.markdownContent} />
            </div>
          </section>

          {!existingShare && (
            <form action={shareAction} className="form" style={{ padding: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>공유 링크 만들기</h3>
              <p className="muted" style={{ fontSize: "12px", marginTop: "-4px" }}>다른 사람에게 보여줄 수 있는 보기 전용 링크를 생성합니다.</p>
              <button className="button secondary" type="submit" style={{ width: "100%", minHeight: "38px" }}>
                공유 페이지 링크 생성
              </button>
            </form>
          )}

          <form action={deleteAction} className="form" style={{ borderColor: "rgba(180, 35, 24, 0.4)", background: "var(--danger-light)", padding: "20px" }}>
            <h2 style={{ fontSize: "18px", color: "var(--danger)", borderBottomColor: "rgba(180, 35, 24, 0.1)" }}>삭제</h2>
            <p className="muted" style={{ fontSize: "13px", marginTop: "-4px" }}>
              이 레시피를 삭제합니다. 삭제된 정보는 복구할 수 없으며, 모든 조리 단계 및 재료 연결이 함께 제거됩니다.
            </p>
            <ConfirmSubmitButton message="정말로 이 레시피를 영구 삭제하시겠습니까?">
              <Trash2 size={16} style={{ marginRight: "6px" }} />
              레시피 영구 삭제
            </ConfirmSubmitButton>
          </form>
        </aside>
      </section>
    </>
  );
}

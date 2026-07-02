import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiRecipeAssistant } from "@/components/AiRecipeAssistant";
import { ImageField } from "@/components/ImageField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createRecipeAction } from "@/features/recipes/actions";
import { getKitchen } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

type NewRecipePageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewRecipePage({ params }: NewRecipePageProps) {
  const { id } = await params;
  const kitchen = await getKitchen(id);

  if (!kitchen) {
    notFound();
  }

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <Link href={paths.kitchen(kitchen.id)} className="button secondary" style={{ minHeight: "36px", padding: "0 12px", fontSize: "13px" }}>
          <ArrowLeft size={16} />
          주방({kitchen.name})으로 돌아가기
        </Link>
      </div>

      <section className="page-header" style={{ marginBottom: "36px" }}>
        <p className="eyebrow">{kitchen.name}</p>
        <h1 className="page-title">레시피 작성</h1>
        <p className="muted">본문을 쓰고 분석한 뒤 문서로 저장합니다.</p>
      </section>

      <form action={createRecipeAction} className="form" style={{ gap: "28px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--primary-light)", paddingBottom: "10px" }}>
          <h2 style={{ border: "none", margin: 0, padding: 0 }}>새 문서</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "600" }}>작성 · 분석 · 저장</span>
        </div>

        <input name="kitchenId" type="hidden" value={kitchen.id} />
        
        <div style={{ padding: "20px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg)" }}>
          <ImageField />
        </div>

        <AiRecipeAssistant />

        <div className="field">
          <label htmlFor="title">레시피 이름</label>
          <input className="input" id="title" name="title" placeholder="분석 결과가 자동으로 채워지며 직접 수정할 수 있습니다." />
        </div>

        <div className="field">
          <label htmlFor="description">간단 설명</label>
          <textarea className="textarea" id="description" name="description" placeholder="이 레시피의 요약이나 핵심 특징을 입력하세요." />
        </div>

        <div className="field">
          <label htmlFor="markdownContent">레시피 문서</label>
          <textarea
            className="textarea"
            id="markdownContent"
            name="markdownContent"
            placeholder="분석을 실행하면 정리된 문서가 자동으로 채워집니다."
            style={{ minHeight: "180px" }}
          />
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
          <SubmitButton>
            <FileText size={18} aria-hidden="true" />
            레시피 문서 만들기
          </SubmitButton>
        </div>
      </form>
    </>
  );
}

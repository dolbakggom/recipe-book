import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { createKitchenAction } from "@/features/kitchens/actions";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

export default function NewKitchenPage() {
  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <Link
          href={paths.kitchens()}
          className="button secondary"
          style={{ minHeight: "36px", padding: "0 12px", fontSize: "13px" }}
        >
          <ArrowLeft size={16} />
          내 주방으로 돌아가기
        </Link>
      </div>

      <section className="page-header" style={{ marginBottom: "36px" }}>
        <p className="eyebrow">새 주방</p>
        <h1 className="page-title">주방 만들기</h1>
        <p className="muted">
          주방을 만들면 이 브라우저가 관리자 권한을 갖습니다.
        </p>
      </section>

      <form
        action={createKitchenAction}
        className="form"
        style={{ gap: "24px", maxWidth: "720px", margin: "0 auto" }}
      >
        <div className="field">
          <label htmlFor="name">주방 이름</label>
          <input
            className="input"
            id="name"
            name="name"
            required
            placeholder="예: 우리집 집밥, 맛나식당 본점"
          />
        </div>

        <div className="field">
          <label htmlFor="description">설명</label>
          <textarea
            className="textarea"
            id="description"
            name="description"
            placeholder="이 주방에 대한 간단한 설명을 입력하세요."
          />
        </div>

        <div className="field">
          <label htmlFor="type">구분</label>
          <select className="select" id="type" name="type" defaultValue="PERSONAL">
            <option value="PERSONAL">개인용</option>
            <option value="STORE">매장용</option>
          </select>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "20px",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button className="button" type="submit">
            <Plus size={18} aria-hidden="true" />
            주방 만들기
          </button>
        </div>
      </form>
    </>
  );
}

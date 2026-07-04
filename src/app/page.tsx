import { ArrowRight, Link2, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <section className="page-header">
        <p className="eyebrow">레시피북</p>
        <h1 className="page-title">어떻게 시작할까요?</h1>
        <p className="muted">
          공유받은 주방을 열거나, 나만의 주방을 만들어 레시피를 추가할 수
          있습니다.
        </p>
      </section>

      <section className="home-choice-grid">
        <form action={openSharedKitchenAction} className="form">
          <div className="home-choice-icon">
            <Link2 size={22} aria-hidden="true" />
          </div>
          <h2>공유 주방 열기</h2>
          <p className="muted">
            받은 공유 링크나 공유 토큰을 붙여 넣어 읽기 전용 주방으로
            들어갑니다.
          </p>
          <div className="field">
            <label htmlFor="shareLink">공유 링크</label>
            <input
              className="input"
              id="shareLink"
              name="shareLink"
              placeholder="https://.../shared/..."
            />
          </div>
          <button className="button" type="submit">
            공유 주방 접속
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        <section className="form">
          <div className="home-choice-icon">
            <Plus size={22} aria-hidden="true" />
          </div>
          <h2>내 주방 만들기</h2>
          <p className="muted">
            이 브라우저를 관리자로 등록하고 레시피를 작성합니다.
          </p>
          <div className="button-row" style={{ marginTop: "auto" }}>
            <Link className="button" href={paths.newKitchen()}>
              주방 만들기
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="button secondary" href={paths.kitchens()}>
              내 주방 보기
            </Link>
          </div>
        </section>
      </section>
    </>
  );
}

async function openSharedKitchenAction(formData: FormData) {
  "use server";

  const token = extractShareToken(String(formData.get("shareLink") ?? ""));
  redirect(paths.shared(token || "invalid"));
}

function extractShareToken(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const sharedIndex = segments.indexOf("shared");
    return sharedIndex >= 0 ? segments[sharedIndex + 1] ?? "" : trimmed;
  } catch {
    return trimmed.replace(/^\/?shared\//, "").split("/")[0] ?? "";
  }
}

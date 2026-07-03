import { Plus } from "lucide-react";
import Link from "next/link";
import { createKitchenAction } from "@/features/kitchens/actions";
import { listKitchens } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

function getGradientFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 35%, 50%), hsl(${h2}, 45%, 35%))`;
}

export default async function KitchensPage() {
  const kitchens = await listKitchens();

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">레시피 보관함</p>
        <h1 className="page-title">주방</h1>
        <p className="muted">레시피를 주방 단위로 묶고 관리합니다.</p>
      </section>

      <section className="split">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "var(--primary)", margin: 0 }}>
            내 주방
          </h2>
          {kitchens.length === 0 ? (
            <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
              <p className="muted" style={{ margin: 0 }}>등록된 주방이 없습니다.</p>
              <p className="muted" style={{ fontSize: "14px", marginTop: "8px" }}>오른쪽에서 첫 주방을 만들어 보세요.</p>
            </div>
          ) : (
            <div className="grid">
              {kitchens.map((kitchen) => {
                const gradient = getGradientFromId(kitchen.id);
                return (
                  <Link href={paths.kitchen(kitchen.id)} className="card" key={kitchen.id}>
                    <div className="decor-banner" style={{ background: gradient }} />
                    <h2>{kitchen.name}</h2>
                    <p className="muted" style={{ minHeight: "44px", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {kitchen.description || "설명이 등록되지 않았습니다."}
                    </p>
                    <div className="tag-row" style={{ marginTop: "12px" }}>
                      <span className="tag" style={{ background: kitchen.type === "STORE" ? "var(--accent-light)" : "var(--primary-light)", color: kitchen.type === "STORE" ? "var(--accent)" : "var(--primary)" }}>
                        {kitchen.type === "STORE" ? "매장용" : "개인용"}
                      </span>
                      <span className="tag">레시피 {kitchen._count.recipes}</span>
                      <span className="tag">재료 {kitchen._count.ingredients}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <form action={createKitchenAction} className="form" style={{ position: "sticky", top: "100px" }}>
          <h2>새 주방</h2>
          <p className="muted" style={{ fontSize: "13px", marginTop: "-8px", marginBottom: "8px" }}>
            새로운 레시피 공간을 만듭니다.
          </p>
          <div className="field">
            <label htmlFor="name">주방 이름</label>
            <input className="input" id="name" name="name" required placeholder="예: 우리집 집밥, 맛나식당 본점" />
          </div>
          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea className="textarea" id="description" name="description" placeholder="이 주방에 대한 간단한 설명을 입력하세요." />
          </div>
          <div className="field">
            <label htmlFor="type">구분</label>
            <select className="select" id="type" name="type" defaultValue="PERSONAL">
              <option value="PERSONAL">개인용 (가정, 취미 등)</option>
              <option value="STORE">매장용 (식당, 카페 등)</option>
            </select>
          </div>
          <button className="button" type="submit" style={{ marginTop: "8px" }}>
            <Plus size={18} aria-hidden="true" />
            주방 만들기
          </button>
        </form>
      </section>
    </>
  );
}

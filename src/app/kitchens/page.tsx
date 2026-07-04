import { Plus } from "lucide-react";
import Link from "next/link";
import { listKitchensForOwner } from "@/features/kitchens/data";
import { getCurrentOwnerTokenHash } from "@/features/owners/server";
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
  const ownerTokenHash = await getCurrentOwnerTokenHash();
  const kitchens = await listKitchensForOwner(ownerTokenHash);

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">레시피 보관함</p>
        <h1 className="page-title">내 주방</h1>
        <p className="muted">
          이 브라우저에서 만든 주방과 레시피를 관리합니다.
        </p>
      </section>

      {kitchens.length === 0 ? (
        <section
          className="card"
          style={{
            padding: "48px 32px",
            textAlign: "center",
            alignItems: "center",
            cursor: "default"
          }}
        >
          <h2>아직 만든 주방이 없습니다</h2>
          <p className="muted" style={{ maxWidth: "520px", margin: 0 }}>
            새 주방을 만들면 이 브라우저가 관리자 권한을 갖습니다.
          </p>
          <Link className="button" href={paths.newKitchen()}>
            <Plus size={18} aria-hidden="true" />
            주방 만들기
          </Link>
        </section>
      ) : (
        <section className="grid">
          {kitchens.map((kitchen) => {
            const gradient = getGradientFromId(kitchen.id);
            return (
              <Link
                href={paths.kitchen(kitchen.id)}
                className="card"
                key={kitchen.id}
              >
                <div className="decor-banner" style={{ background: gradient }} />
                <h2>{kitchen.name}</h2>
                <p
                  className="muted"
                  style={{
                    minHeight: "44px",
                    fontSize: "14px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical"
                  }}
                >
                  {kitchen.description || "설명이 등록되지 않았습니다."}
                </p>
                <div className="tag-row" style={{ marginTop: "12px" }}>
                  <span
                    className="tag"
                    style={{
                      background:
                        kitchen.type === "STORE"
                          ? "var(--accent-light)"
                          : "var(--primary-light)",
                      color:
                        kitchen.type === "STORE"
                          ? "var(--accent)"
                          : "var(--primary)"
                    }}
                  >
                    {kitchen.type === "STORE" ? "매장용" : "개인용"}
                  </span>
                  <span className="tag">레시피 {kitchen._count.recipes}</span>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <Link
        aria-label="새 주방 만들기"
        className="floating-action-button"
        href={paths.newKitchen()}
      >
        <Plus size={20} aria-hidden="true" />
        새 주방
      </Link>
    </>
  );
}

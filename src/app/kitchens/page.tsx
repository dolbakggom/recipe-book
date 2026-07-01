import { Plus } from "lucide-react";
import Link from "next/link";
import { createKitchenAction } from "@/features/kitchens/actions";
import { listKitchens } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

export default async function KitchensPage() {
  const kitchens = await listKitchens();

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Recipe archive</p>
        <h1 className="page-title">Kitchens</h1>
        <p className="muted">레시피를 Kitchen 단위로 묶고 관리합니다.</p>
      </section>

      <section className="split">
        <form action={createKitchenAction} className="form">
          <h2>New Kitchen</h2>
          <div className="field">
            <label htmlFor="name">Kitchen 이름</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea className="textarea" id="description" name="description" />
          </div>
          <div className="field">
            <label htmlFor="type">구분</label>
            <select className="select" id="type" name="type" defaultValue="PERSONAL">
              <option value="PERSONAL">개인용</option>
              <option value="STORE">매장용</option>
            </select>
          </div>
          <button className="button" type="submit">
            <Plus size={18} aria-hidden="true" />
            Kitchen 생성
          </button>
        </form>

        <div className="grid">
          {kitchens.map((kitchen) => (
            <Link href={paths.kitchen(kitchen.id)} className="card" key={kitchen.id}>
              <h2>{kitchen.name}</h2>
              <p className="muted">{kitchen.description || "설명이 없습니다."}</p>
              <div className="tag-row">
                <span className="tag">{kitchen.type === "STORE" ? "매장용" : "개인용"}</span>
                <span className="tag">Recipes {kitchen._count.recipes}</span>
                <span className="tag">Ingredients {kitchen._count.ingredients}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

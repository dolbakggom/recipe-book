"use client";

import { useState } from "react";
import { Clipboard, Check } from "lucide-react";

type CopyShareLinkProps = {
  shareUrl: string;
};

export function CopyShareLink({ shareUrl }: CopyShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <div className="form" style={{ gap: "12px", background: "var(--accent-light)", borderColor: "var(--accent)" }}>
      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "var(--accent-hover)" }}>
        공유용 웹 링크가 생성되었습니다
      </h3>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          className="input"
          readOnly
          value={shareUrl}
          style={{ 
            fontSize: "13px", 
            background: "var(--surface)", 
            color: "var(--muted)",
            borderColor: "var(--border)",
            cursor: "text"
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          className="button"
          type="button"
          onClick={handleCopy}
          style={{ 
            minWidth: "110px", 
            minHeight: "44px",
            background: copied ? "var(--primary)" : "var(--accent)"
          }}
        >
          {copied ? (
            <>
              <Check size={16} />
              복사됨
            </>
          ) : (
            <>
              <Clipboard size={16} />
              링크 복사
            </>
          )}
        </button>
      </div>
    </div>
  );
}

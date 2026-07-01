"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button className="button" type="submit" disabled={pending}>
      {pending && <Loader2 size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}

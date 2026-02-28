"use client";

import { useState, useTransition } from "react";

interface AdminVisibilityToggleProps {
  slug: string;
  initialPublic: boolean;
}

const encodeVisibility = (isPublic: boolean) => JSON.stringify({ isPublic });

export function AdminVisibilityToggle({ slug, initialPublic }: AdminVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const save = (nextValue: boolean) => {
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/cms/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          contentHtml: encodeVisibility(nextValue),
          title: "Test Page Settings",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: "Unable to save visibility." }))) as {
          message?: string;
        };
        setError(payload.message ?? "Unable to save visibility.");
        return;
      }

      setIsPublic(nextValue);
    });
  };

  return (
    <div className="rounded border border-[var(--db-border)] bg-[#eef4ec] p-3 text-sm">
      <p className="font-semibold text-[#173724]">Visibility</p>
      <p className="mt-1 text-[#35513d]">
        {isPublic ? "Public: everyone can view /testpage" : "Admin only: only admin accounts can view /testpage"}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={isPending || !isPublic}
          className="rounded border border-[var(--db-border)] bg-white px-3 py-1 text-xs font-bold text-[#173724] disabled:opacity-60"
        >
          Admin Only
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={isPending || isPublic}
          className="rounded border border-[var(--db-border)] bg-white px-3 py-1 text-xs font-bold text-[#173724] disabled:opacity-60"
        >
          Make Public
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-[#9b1616]">{error}</p> : null}
    </div>
  );
}

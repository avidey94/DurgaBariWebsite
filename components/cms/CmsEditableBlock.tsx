"use client";

import { useState, useTransition } from "react";

import { AdminEditToggle } from "@/components/cms/AdminEditToggle";
import { InlineRichEditor } from "@/components/cms/InlineRichEditor";
import { sanitizeHtml } from "@/lib/cms/sanitize-html";

interface CmsEditableBlockProps {
  slug: string;
  initialHtml: string;
  initialTitle?: string | null;
  isAdmin: boolean;
}

export function CmsEditableBlock({ slug, initialHtml, initialTitle = null, isAdmin }: CmsEditableBlockProps) {
  const [editing, setEditing] = useState(false);
  const [savedHtml, setSavedHtml] = useState(initialHtml);
  const [draftHtml, setDraftHtml] = useState(initialHtml);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const cancelEdit = () => {
    setDraftHtml(savedHtml);
    setEditing(false);
    setError("");
  };

  const save = () => {
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/cms/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title: initialTitle,
          contentHtml: draftHtml,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: "Unable to save." }))) as {
          message?: string;
        };
        setError(payload.message ?? "Unable to save.");
        return;
      }

      const payload = (await response.json()) as {
        page: { content_html: string };
      };

      const nextHtml = payload.page?.content_html ?? draftHtml;
      setSavedHtml(nextHtml);
      setDraftHtml(nextHtml);
      setEditing(false);
    });
  };

  const safeHtml = sanitizeHtml(editing ? draftHtml : savedHtml);

  return (
    <div className="space-y-3">
      {isAdmin ? (
        <div className="flex items-center justify-end gap-2">
          <AdminEditToggle editing={editing} onToggle={() => setEditing((value) => !value)} disabled={isPending} />
        </div>
      ) : null}

      {editing ? (
        <div className="space-y-2">
          <InlineRichEditor value={draftHtml} onChange={setDraftHtml} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded border border-[#173724] bg-[#173724] px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isPending}
              className="rounded border border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#173724] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
          {error ? <p className="text-sm text-[#9b1616]">{error}</p> : null}
        </div>
      ) : (
        <div
          className="text-[17px] leading-8 text-[#1f2a22]"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}
    </div>
  );
}

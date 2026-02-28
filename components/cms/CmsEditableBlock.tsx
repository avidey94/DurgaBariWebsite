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

interface CmsPageVersion {
  id: string;
  content_html: string;
  created_at: string;
}

export function CmsEditableBlock({ slug, initialHtml, initialTitle = null, isAdmin }: CmsEditableBlockProps) {
  const [editing, setEditing] = useState(false);
  const [savedHtml, setSavedHtml] = useState(initialHtml);
  const [draftHtml, setDraftHtml] = useState(initialHtml);
  const [versions, setVersions] = useState<CmsPageVersion[]>([]);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadVersions = async () => {
    const response = await fetch(`/api/cms/page/versions?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) return;

    const payload = (await response.json()) as { versions?: CmsPageVersion[] };
    setVersions(payload.versions ?? []);
    setVersionsLoaded(true);
  };

  const toggleEditing = async () => {
    const nextEditing = !editing;
    setEditing(nextEditing);
    setError("");

    if (nextEditing && isAdmin && !versionsLoaded) {
      await loadVersions();
    }
  };

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
      await loadVersions();
    });
  };

  const rollbackToVersion = (versionId: string) => {
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/cms/page/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          versionId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: "Unable to rollback." }))) as {
          message?: string;
        };
        setError(payload.message ?? "Unable to rollback.");
        return;
      }

      const payload = (await response.json()) as {
        page: { content_html: string };
      };

      const nextHtml = payload.page?.content_html ?? savedHtml;
      setSavedHtml(nextHtml);
      setDraftHtml(nextHtml);
      await loadVersions();
    });
  };

  const safeHtml = sanitizeHtml(editing ? draftHtml : savedHtml);

  return (
    <div className="space-y-3">
      {isAdmin ? (
        <div className="flex items-center justify-end gap-2">
          <AdminEditToggle editing={editing} onToggle={toggleEditing} disabled={isPending} />
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
          <div className="mt-3 border border-[var(--db-border)] bg-[#f7faf6] p-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#35513d]">Version History</p>
            {versions.length === 0 ? (
              <p className="mt-1 text-sm text-[#35513d]">No previous versions yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {versions.map((version) => (
                  <li key={version.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6e3d6] pb-2 last:border-b-0">
                    <span className="text-sm text-[#1f2a22]">
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setDraftHtml(version.content_html);
                        }}
                        disabled={isPending}
                        className="rounded border border-[var(--db-border)] bg-white px-2 py-1 text-xs font-semibold text-[#173724]"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => rollbackToVersion(version.id)}
                        disabled={isPending}
                        className="rounded border border-[var(--db-border)] bg-white px-2 py-1 text-xs font-semibold text-[#173724]"
                      >
                        Rollback
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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

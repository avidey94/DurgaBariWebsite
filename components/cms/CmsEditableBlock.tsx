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

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) => stripHtml(value).split(/(\s+)/).filter((token) => token.length > 0);

type DiffToken =
  | { type: "same"; value: string }
  | { type: "removed"; value: string }
  | { type: "added"; value: string };

const buildDiffTokens = (leftValue: string, rightValue: string): DiffToken[] => {
  const left = tokenize(leftValue);
  const right = tokenize(rightValue);
  const m = left.length;
  const n = right.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (left[i] === right[j]) {
      result.push({ type: "same", value: left[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "removed", value: left[i] });
      i += 1;
    } else {
      result.push({ type: "added", value: right[j] });
      j += 1;
    }
  }

  while (i < m) {
    result.push({ type: "removed", value: left[i] });
    i += 1;
  }

  while (j < n) {
    result.push({ type: "added", value: right[j] });
    j += 1;
  }

  return result;
};

export function CmsEditableBlock({ slug, initialHtml, initialTitle = null, isAdmin }: CmsEditableBlockProps) {
  const [editing, setEditing] = useState(false);
  const [savedHtml, setSavedHtml] = useState(initialHtml);
  const [draftHtml, setDraftHtml] = useState(initialHtml);
  const [versions, setVersions] = useState<CmsPageVersion[]>([]);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [compareLeftId, setCompareLeftId] = useState("");
  const [compareRightId, setCompareRightId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadVersions = async () => {
    const response = await fetch(`/api/cms/page/versions?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) return;

    const payload = (await response.json()) as { versions?: CmsPageVersion[] };
    const nextVersions = payload.versions ?? [];
    setVersions(nextVersions);
    if (nextVersions.length >= 2 && (!compareLeftId || !compareRightId)) {
      setCompareLeftId(nextVersions[0]?.id ?? "");
      setCompareRightId(nextVersions[1]?.id ?? "");
    } else if (nextVersions.length === 1 && !compareLeftId) {
      setCompareLeftId(nextVersions[0].id);
    }
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
  const compareLeft = versions.find((version) => version.id === compareLeftId) ?? null;
  const compareRight = versions.find((version) => version.id === compareRightId) ?? null;
  const diffTokens =
    compareLeft && compareRight && compareLeft.id !== compareRight.id
      ? buildDiffTokens(compareLeft.content_html, compareRight.content_html)
      : [];

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
              <>
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

                {versions.length >= 2 ? (
                  <div className="mt-3 rounded border border-[#d6e3d6] bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#35513d]">Compare Two Versions</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <label className="text-xs font-semibold text-[#35513d]">
                        Version A
                        <select
                          value={compareLeftId}
                          onChange={(event) => setCompareLeftId(event.target.value)}
                          className="mt-1 w-full rounded border border-[var(--db-border)] bg-white px-2 py-1 text-sm text-[#1f2a22]"
                        >
                          {versions.map((version) => (
                            <option key={`left-${version.id}`} value={version.id}>
                              {new Date(version.created_at).toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-[#35513d]">
                        Version B
                        <select
                          value={compareRightId}
                          onChange={(event) => setCompareRightId(event.target.value)}
                          className="mt-1 w-full rounded border border-[var(--db-border)] bg-white px-2 py-1 text-sm text-[#1f2a22]"
                        >
                          {versions.map((version) => (
                            <option key={`right-${version.id}`} value={version.id}>
                              {new Date(version.created_at).toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-2 max-h-48 overflow-auto rounded border border-[var(--db-border)] bg-[#fcfefb] p-2 text-sm leading-6 text-[#1f2a22]">
                      {diffTokens.length === 0 ? (
                        <p className="text-[#35513d]">Select two different versions to view the diff.</p>
                      ) : (
                        <p>
                          {diffTokens.map((token, index) => (
                            <span
                              key={`${token.type}-${index}`}
                              className={
                                token.type === "added"
                                  ? "bg-[#d9f3dc] text-[#1f4f32]"
                                  : token.type === "removed"
                                    ? "bg-[#f9d6d6] text-[#7f1d1d] line-through"
                                    : ""
                              }
                            >
                              {token.value}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
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

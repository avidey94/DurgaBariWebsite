"use client";

import { useMemo, useState, useTransition } from "react";

import { AdminEditToggle } from "@/components/cms/AdminEditToggle";

interface CmsEditableListProps {
  slug: string;
  initialItems: string[];
  isAdmin: boolean;
  emptyItemLabel?: string;
}

const encodeItems = (items: string[]) => JSON.stringify(items.map((item) => item.trim()).filter(Boolean));

export function CmsEditableList({
  slug,
  initialItems,
  isAdmin,
  emptyItemLabel = "List item",
}: CmsEditableListProps) {
  const sanitizedInitialItems = useMemo(
    () => initialItems.map((item) => item.trim()).filter(Boolean),
    [initialItems],
  );

  const [editing, setEditing] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>(sanitizedInitialItems);
  const [draftItems, setDraftItems] = useState<string[]>(sanitizedInitialItems);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const cancel = () => {
    setDraftItems(savedItems);
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
          contentHtml: encodeItems(draftItems),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: "Unable to save." }))) as {
          message?: string;
        };
        setError(payload.message ?? "Unable to save.");
        return;
      }

      const next = draftItems.map((item) => item.trim()).filter(Boolean);
      setSavedItems(next);
      setDraftItems(next);
      setEditing(false);
    });
  };

  const updateItem = (index: number, nextValue: string) => {
    setDraftItems((current) => current.map((item, i) => (i === index ? nextValue : item)));
  };

  const removeItem = (index: number) => {
    setDraftItems((current) => current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {isAdmin ? (
        <div className="flex items-center justify-end gap-2">
          <AdminEditToggle editing={editing} onToggle={() => setEditing((value) => !value)} disabled={isPending} />
        </div>
      ) : null}

      {editing ? (
        <div className="space-y-2">
          {draftItems.map((item, index) => (
            <div key={`${slug}-${index}`} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                className="w-full rounded border border-[var(--db-border)] bg-white px-3 py-2 text-sm"
                placeholder={`${emptyItemLabel} ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded border border-[var(--db-border)] bg-white px-2 py-1 text-xs font-bold text-[#9b1616]"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setDraftItems((current) => [...current, ""])}
            className="rounded border border-[var(--db-border)] bg-white px-2 py-1 text-xs font-bold text-[#173724]"
          >
            Add item
          </button>

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
              onClick={cancel}
              disabled={isPending}
              className="rounded border border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#173724] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>

          {error ? <p className="text-sm text-[#9b1616]">{error}</p> : null}
        </div>
      ) : (
        <ul className="space-y-1">
          {savedItems.map((item) => (
            <li key={`${slug}-${item}`} className="flex gap-2">
              <span aria-hidden="true" className="font-bold text-[#9b1616]">
                ▸
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

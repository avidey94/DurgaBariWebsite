"use client";

import { useState, useTransition } from "react";

import { decodeCmsText, encodeCmsText } from "@/lib/cms/cms-text";

export type CmsTextTag = "h1" | "h2" | "h3" | "p" | "span" | "figcaption" | "address" | "strong";

interface CmsEditableTextProps {
  slug: string;
  label: string;
  initialText: string;
  as: CmsTextTag;
  className?: string;
  isAdmin: boolean;
}

export function CmsEditableText({ slug, label, initialText, as: Tag, className, isAdmin }: CmsEditableTextProps) {
  const [saved, setSaved] = useState(initialText);
  const [draft, setDraft] = useState(initialText);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!draft.trim()) { setError("Enter text before saving."); return; }
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/cms/page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, title: label, contentHtml: encodeCmsText(draft.trim()) }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Unable to save.");
        const next = decodeCmsText(payload.page?.content_html ?? encodeCmsText(draft.trim()));
        setSaved(next);
        setDraft(next);
        setEditing(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save.");
      }
    });
  };

  return <>
    <Tag className={className}>
      {saved}
      {isAdmin && <button type="button" className="cms-field-edit" aria-label={`Edit ${label}`} title={`Edit ${label}`} onClick={() => { setDraft(saved); setError(""); setEditing(!editing); }}>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 14.5 1 2.5 2.5-1L16 7.5 12.5 4 4 12.5v2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m10.5 6 3.5 3.5" stroke="currentColor" strokeWidth="1.4"/></svg>
      </button>}
    </Tag>
    {editing && isAdmin && <div className="cms-field-editor">
      <label htmlFor={`cms-${slug}`}>{label}</label>
      <textarea id={`cms-${slug}`} value={draft} onChange={(event) => setDraft(event.target.value)} rows={Math.max(2, Math.min(5, Math.ceil(draft.length / 75)))} autoFocus />
      {error && <p role="alert">{error}</p>}
      <div><button type="button" onClick={save} disabled={pending}>Save</button><button type="button" onClick={() => { setEditing(false); setError(""); }} disabled={pending}>Cancel</button></div>
    </div>}
  </>;
}

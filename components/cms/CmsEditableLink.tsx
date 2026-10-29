"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { ArrowDownIcon, ArrowUpRightIcon } from "@/components/elevated/Icons";
import { decodeCmsText, encodeCmsText } from "@/lib/cms/cms-text";

export type CmsLinkIcon = "up-right" | "down" | "none";

interface CmsEditableLinkProps {
  slug: string;
  label: string;
  initialText: string;
  href: string;
  className?: string;
  icon: CmsLinkIcon;
  isAdmin: boolean;
}

export function CmsEditableLink({ slug, label, initialText, href, className, icon, isAdmin }: CmsEditableLinkProps) {
  const [saved, setSaved] = useState(initialText);
  const [draft, setDraft] = useState(initialText);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const external = /^https?:|^mailto:/.test(href);
  const content = <>{saved}{icon === "up-right" ? <ArrowUpRightIcon /> : icon === "down" ? <ArrowDownIcon /> : null}</>;

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

  return <span className="cms-link-field">
    {external ? <a className={className} href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">{content}</a> : <Link className={className} href={href}>{content}</Link>}
    {isAdmin && <button type="button" className="cms-field-edit" aria-label={`Edit ${label}`} title={`Edit ${label}`} onClick={() => { setDraft(saved); setError(""); setEditing(!editing); }}>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 14.5 1 2.5 2.5-1L16 7.5 12.5 4 4 12.5v2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m10.5 6 3.5 3.5" stroke="currentColor" strokeWidth="1.4"/></svg>
    </button>}
    {editing && isAdmin && <span className="cms-link-editor cms-field-editor">
      <label htmlFor={`cms-${slug}`}>{label}</label>
      <input id={`cms-${slug}`} value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
      {error && <span role="alert">{error}</span>}
      <span><button type="button" onClick={save} disabled={pending}>Save</button><button type="button" onClick={() => { setEditing(false); setError(""); }} disabled={pending}>Cancel</button></span>
    </span>}
  </span>;
}

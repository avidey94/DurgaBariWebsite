"use client";

import { useState, useTransition } from "react";

import { encodeCmsText } from "@/lib/cms/cms-text";

interface CmsEditableImageProps {
  slug: string;
  label: string;
  initialSrc: string;
  initialAlt: string;
  className?: string;
  isAdmin: boolean;
}

const isAllowedImageUrl = (value: string) => (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(value);

export function CmsEditableImage({ slug, label, initialSrc, initialAlt, className, isAdmin }: CmsEditableImageProps) {
  const [src, setSrc] = useState(initialSrc);
  const [alt, setAlt] = useState(initialAlt);
  const [draftSrc, setDraftSrc] = useState(initialSrc);
  const [draftAlt, setDraftAlt] = useState(initialAlt);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!isAllowedImageUrl(draftSrc.trim())) { setError("Enter a site path or an HTTPS image URL."); return; }
    setError("");
    startTransition(async () => {
      try {
        const nextSrc = draftSrc.trim();
        const nextAlt = draftAlt.trim();
        const response = await fetch("/api/cms/page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, title: label, contentHtml: encodeCmsText(JSON.stringify({ src: nextSrc, alt: nextAlt })) }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Unable to save image.");
        setSrc(nextSrc);
        setAlt(nextAlt);
        setEditing(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save image.");
      }
    });
  };

  return <div className={`cms-editable-image${className ? ` ${className}` : ""}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={isAllowedImageUrl(src) ? src : initialSrc} alt={alt} loading={slug.endsWith("hero-image") ? "eager" : "lazy"} fetchPriority={slug.endsWith("hero-image") ? "high" : undefined} />
    {isAdmin && <button type="button" className="cms-media-edit" aria-label={`Edit ${label} image`} title={`Edit ${label} image`} onClick={() => { setDraftSrc(src); setDraftAlt(alt); setError(""); setEditing(!editing); }}>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 14.5 1 2.5 2.5-1L16 7.5 12.5 4 4 12.5v2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m10.5 6 3.5 3.5" stroke="currentColor" strokeWidth="1.4"/></svg>
    </button>}
    {editing && isAdmin && <div className="cms-media-editor cms-field-editor">
      <label htmlFor={`cms-${slug}-src`}>Image URL or site path</label>
      <input id={`cms-${slug}-src`} value={draftSrc} onChange={(event) => setDraftSrc(event.target.value)} autoFocus />
      <label htmlFor={`cms-${slug}-alt`}>Description for screen readers</label>
      <input id={`cms-${slug}-alt`} value={draftAlt} onChange={(event) => setDraftAlt(event.target.value)} />
      {error && <p role="alert">{error}</p>}
      <div><button type="button" onClick={save} disabled={pending}>Save</button><button type="button" onClick={() => { setEditing(false); setError(""); }} disabled={pending}>Cancel</button></div>
    </div>}
  </div>;
}

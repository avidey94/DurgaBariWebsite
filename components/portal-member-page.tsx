import Link from "next/link";
import type { ReactNode } from "react";

export function PortalArrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {diagonal ? <path d="M4.5 13.5 13.5 4.5M6 4.5h7.5V12" /> : <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" />}
    </svg>
  );
}

export function PortalMemberPage({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="member-subpage">
      <div className="member-subpage-inner">
        <header className="member-subpage-hero">
          <Link href="/portal" className="member-subpage-back">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 9h-11M8 4.5 3.5 9 8 13.5" /></svg>
            Member space
          </Link>
          <p className="member-subpage-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className="member-subpage-intro">{description}</p> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

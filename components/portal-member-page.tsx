import Link from "next/link";
import type { ReactNode } from "react";

export type MemberIconName =
  | "giving"
  | "heart"
  | "volunteer"
  | "receipt"
  | "home"
  | "calendar"
  | "check"
  | "clock"
  | "people"
  | "settings";

export function MemberIcon({ name, size = 24 }: { name: MemberIconName; size?: number }) {
  const paths: Record<MemberIconName, ReactNode> = {
    giving: (
      <>
        <path d="M6 3.5h12v17l-3-1.5-3 1.5-3-1.5-3 1.5zM9 8h6M9 12h6M9 16h3" />
      </>
    ),
    heart: (
      <path d="M12 20s-8-4.8-8-10.2a4.4 4.4 0 0 1 8-2.5 4.4 4.4 0 0 1 8 2.5C20 15.2 12 20 12 20Z" />
    ),
    volunteer: (
      <>
        <path d="M12 21v-9M12 12C7 12 4 9 4 4c5 0 8 3 8 8ZM12 16c0-5 3-8 8-8 0 5-3 8-8 8ZM8 21h8" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3.5h9l3 3V21l-3-1.5-3 1.5-3-1.5L6 21zM15 3.5V7h3M9 11h6M9 15h6" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7M5.5 8.5V21h13V8.5M9.5 21v-8h5v8" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h2M14 14h2M8 17.5h2" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5 5.5-5.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="7.5" r="3" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.6" />
      </>
    ),
    settings: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function MemberEmptyState({
  icon = "calendar",
  title,
  description,
  children,
  compact = false,
}: {
  icon?: MemberIconName;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`member-empty-state${compact ? " is-compact" : ""}`}>
      <div className="member-empty-illustration" aria-hidden="true">
        <span />
        <MemberIcon name={icon} size={30} />
        <span />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children ? <div className="member-empty-actions">{children}</div> : null}
    </div>
  );
}

export function MemberLoading({ label = "Loading your account…" }: { label?: string }) {
  return (
    <div className="member-loading" role="status" aria-live="polite">
      <span className="member-loading-bar" />
      <span className="member-loading-bar" />
      <span className="member-loading-bar" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PortalArrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {diagonal ? (
        <path d="M4.5 13.5 13.5 4.5M6 4.5h7.5V12" />
      ) : (
        <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" />
      )}
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
            <svg
              width="15"
              height="15"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14.5 9h-11M8 4.5 3.5 9 8 13.5" />
            </svg>
            Member space
          </Link>
          <div className="member-subpage-heading">
            <p className="member-subpage-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {description ? <p className="member-subpage-intro">{description}</p> : null}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

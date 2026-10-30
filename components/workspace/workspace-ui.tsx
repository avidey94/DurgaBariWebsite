import type { ReactNode } from "react";

export type WorkspaceIconName =
  | "home"
  | "inbox"
  | "heart"
  | "calendar"
  | "users"
  | "receipt"
  | "folder"
  | "key"
  | "arrow"
  | "check"
  | "search"
  | "plus"
  | "clock"
  | "spark"
  | "chevron"
  | "menu"
  | "close"
  | "logout"
  | "external"
  | "volunteer"
  | "shield";

const paths: Record<WorkspaceIconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 4h16l2 11v5H2v-5L4 4Z" />
      <path d="M2 15h6l2 3h4l2-3h6" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6M22 21v-3a7 7 0 0 0-4-6" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v19l-3-2-4 2-4-2-3 2V3ZM9 8h6M9 12h6M9 16h3" />
    </>
  ),
  folder: <path d="M3 5h7l2 3h9v12H3V5Z" />,
  key: (
    <>
      <circle cx="8" cy="8" r="5" />
      <path d="m12 12 9 9M17 17l3-3M19 19l3-3" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Z" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: (
    <>
      <path d="M9 4H4v16h5M9 12h12m-5-5 5 5-5 5" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" />
    </>
  ),
  volunteer: (
    <>
      <path d="M12 21s-9-5.5-9-12a4 4 0 0 1 7-2.5L12 9l2-2.5A4 4 0 0 1 21 9c0 6.5-9 12-9 12Z" />
      <path d="m8 13 3 3 5-6" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 9 4v6c0 5-9 9-9 9s-9-4-9-9V7l9-4Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
};

export function WorkspaceIcon({ name, size = 20 }: { name: WorkspaceIconName; size?: number }) {
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

export function WorkspaceEmpty({
  icon = "spark",
  eyebrow,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: WorkspaceIconName;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`workspace-empty${compact ? " workspace-empty-compact" : ""}`}>
      <span className="workspace-empty-art">
        <WorkspaceIcon name={icon} size={30} />
        <span />
        <span />
      </span>
      {eyebrow ? <p className="workspace-eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="workspace-empty-actions">{action}</div> : null}
    </div>
  );
}

export function WorkspaceNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success";
}) {
  return (
    <div
      className={`workspace-notice workspace-notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <WorkspaceIcon name={tone === "success" ? "check" : tone === "error" ? "shield" : "clock"} />
      <div>{children}</div>
    </div>
  );
}

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="workspace-page-header">
      <div>
        <p className="workspace-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="workspace-page-description">{description}</p>
      </div>
      {action ? <div className="workspace-header-action">{action}</div> : null}
    </header>
  );
}

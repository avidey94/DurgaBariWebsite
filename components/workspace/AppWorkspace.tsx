"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { DurgaBariMark } from "@/components/brand/DurgaBariMark";
import { WorkspaceIcon } from "./workspace-ui";
import {
  getAdminNavigation,
  memberNavigation,
  roleNames,
  type WorkspaceNavItem,
} from "@/lib/portal/navigation";
import type { FamilyRole } from "@/lib/portal/types";

interface Props {
  children: ReactNode;
  mode: "member" | "admin";
  email: string;
  roles: FamilyRole[];
  canAdmin: boolean;
  inboxCount?: number | null;
  memberReady?: boolean;
  foundingFamily?: boolean;
  previewLabel?: string | null;
}

export function AppWorkspace({
  children,
  mode,
  email,
  roles,
  canAdmin,
  inboxCount,
  memberReady = true,
  foundingFamily = false,
  previewLabel,
}: Props) {
  const pathname = usePathname();
  const navigation =
    mode === "admin"
      ? getAdminNavigation(roles)
      : memberReady
        ? memberNavigation.filter(
            (item) => item.href !== "/portal/foundingfamily" || foundingFamily,
          )
        : memberNavigation.filter((item) => item.href === "/portal" || item.href === "/calendar");
  const groups = Array.from(new Set(navigation.map((item) => item.group)));
  const current = navigation.find((item) => item.href === pathname);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node))
        accountRef.current?.removeAttribute("open");
    };
    const dismissEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && accountRef.current?.open) {
        accountRef.current.removeAttribute("open");
        accountRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissEscape);
    };
  }, []);
  useEffect(() => {
    accountRef.current?.removeAttribute("open");
  }, [pathname]);
  const staffRoles = roles.filter((role) => role !== "member");
  const role = staffRoles.map((role) => roleNames[role]).join(" · ") || "Community member";
  const closeNavigation = () => dialogRef.current?.close();

  function navigationLink(item: WorkspaceNavItem) {
    const isCurrent = item.href === pathname;
    return (
      <Link
        href={item.href}
        key={item.href}
        aria-current={isCurrent ? "page" : undefined}
        className={`workspace-nav-link${isCurrent ? " is-active" : ""}`}
        onClick={closeNavigation}
      >
        <WorkspaceIcon name={item.icon} />
        <span>{item.label}</span>
        {item.href === "/admin/notifications" &&
        typeof inboxCount === "number" &&
        inboxCount > 0 ? (
          <b className="workspace-count">{inboxCount}</b>
        ) : null}
      </Link>
    );
  }

  const navigationContent = (
    <>
      <Link className="workspace-brand" href="/" aria-label="Durga Bari home">
        <DurgaBariMark />
        <span>
          Durga Bari<small>A place to belong</small>
        </span>
      </Link>
      {canAdmin ? (
        <nav className="workspace-mode-switch" aria-label="Choose workspace">
          <Link
            href="/portal"
            aria-current={mode === "member" ? "true" : undefined}
            onClick={closeNavigation}
          >
            Member space
          </Link>
          <Link
            href="/admin"
            aria-current={mode === "admin" ? "true" : undefined}
            onClick={closeNavigation}
          >
            Team workspace
          </Link>
        </nav>
      ) : (
        <p className="workspace-sidebar-title">Your member space</p>
      )}
      <nav
        className="workspace-navigation"
        aria-label={mode === "admin" ? "Team navigation" : "Member navigation"}
      >
        {groups.map((group) => (
          <div className="workspace-nav-group" key={group}>
            <p>{group}</p>
            {navigation.filter((item) => item.group === group).map(navigationLink)}
          </div>
        ))}
      </nav>
      <div className="workspace-sidebar-bottom">
        <div className="workspace-help">
          <span className="workspace-help-mark">✧</span>
          <strong>Here for our community.</strong>
          <p>A little help goes a long way.</p>
          <Link href="/contact" onClick={closeNavigation}>
            Contact Durga Bari <WorkspaceIcon name="arrow" size={14} />
          </Link>
        </div>
        <Link href="/" className="workspace-back-site" onClick={closeNavigation}>
          <WorkspaceIcon name="external" size={16} />
          Visit the website
        </Link>
      </div>
    </>
  );

  return (
    <div className={`workspace workspace-${mode}`}>
      <a className="workspace-skip" href="#workspace-content">
        Skip to content
      </a>
      <aside className="workspace-sidebar">{navigationContent}</aside>
      <div className="workspace-main">
        {previewLabel ? (
          <div className="workspace-preview">
            <span>Previewing {previewLabel}</span>
            <button
              onClick={async () => {
                await fetch("/api/admin/preview", { method: "DELETE" });
                window.location.href = "/admin/roles";
              }}
            >
              End preview
            </button>
          </div>
        ) : null}
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            <span>{mode === "admin" ? "Team workspace" : "Member space"}</span>
            <WorkspaceIcon name="chevron" size={13} />
            <strong>{current?.label ?? "Your community"}</strong>
          </div>
          <Link href="/" className="workspace-mobile-brand">
            Durga Bari
          </Link>
          <div className="workspace-topbar-actions">
            {mode === "admin" ? (
              <Link
                href="/admin/notifications"
                className="workspace-icon-button"
                aria-label={inboxCount ? `Review inbox, ${inboxCount} pending` : "Review inbox"}
              >
                <WorkspaceIcon name="inbox" />
                {inboxCount ? <i /> : null}
              </Link>
            ) : (
              <Link className="workspace-topbar-calendar" href="/calendar">
                <WorkspaceIcon name="calendar" size={16} />
                Community calendar
              </Link>
            )}
            <details ref={accountRef} className="workspace-account">
              <summary aria-label="Your account">
                <span className="workspace-avatar">{email.slice(0, 1).toUpperCase()}</span>
              </summary>
              <div className="workspace-account-popover">
                <p className="workspace-eyebrow">Signed in</p>
                <strong>{email}</strong>
                <span>{role}</span>
                <Link href="/portal">Your member home</Link>
                {canAdmin ? (
                  <Link href={mode === "admin" ? "/portal" : "/admin"}>
                    {mode === "admin" ? "Switch to member space" : "Open team workspace"}
                  </Link>
                ) : null}
                <form action="/api/auth/logout" method="post">
                  <button type="submit">
                    <WorkspaceIcon name="logout" size={16} />
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <div id="workspace-content" className="workspace-content" tabIndex={-1}>
          {children}
        </div>
        <footer className="workspace-footer">
          <span>Durga Bari · San Jose, California</span>
          <span>Community. Culture. Devotion.</span>
        </footer>
      </div>
      <nav className="workspace-mobile-nav" aria-label="Quick navigation">
        {(mode === "admin"
          ? navigation.filter((item) =>
              ["/admin", "/admin/notifications", "/admin/calendar"].includes(item.href),
            )
          : navigation.filter((item) =>
              ["/portal", "/portal/donations", "/portal/volunteer"].includes(item.href),
            )
        ).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <WorkspaceIcon name={item.icon} />
            <span>
              {item.href === "/admin/notifications"
                ? "Inbox"
                : item.href === "/portal/volunteer"
                  ? "Serve"
                  : item.href === "/portal/donations"
                    ? "Giving"
                    : item.href === "/admin" || item.href === "/portal"
                      ? "Home"
                      : item.label}
            </span>
          </Link>
        ))}
        <button
          ref={toggleRef}
          type="button"
          aria-label="Open workspace navigation"
          aria-haspopup="dialog"
          onClick={() => dialogRef.current?.showModal()}
        >
          <WorkspaceIcon name="menu" />
          <span>More</span>
        </button>
      </nav>
      <dialog
        ref={dialogRef}
        className="workspace-mobile-dialog"
        aria-label="Workspace navigation"
        onClose={() => toggleRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeNavigation();
        }}
      >
        <div className="workspace-drawer-inner">
          <button
            className="workspace-drawer-close workspace-icon-button"
            onClick={closeNavigation}
            aria-label="Close navigation"
          >
            <WorkspaceIcon name="close" />
          </button>
          {navigationContent}
          <div className="workspace-drawer-account">
            <span>{email}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit">
                <WorkspaceIcon name="logout" size={16} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DurgaBariMark } from "@/components/brand/DurgaBariMark";
import { OriginalSiteLink } from "@/components/brand/OriginalSiteLink";
import type { PortalUser, PreviewState } from "@/lib/types";
import { Arrow } from "./CinematicIcons";
import styles from "./HomePageCinematic.module.css";

export function CinematicHeader({
  user,
  showAdminLink,
  adminNotificationCount,
  preview,
  page = "home",
}: {
  user: PortalUser | null;
  showAdminLink: boolean;
  adminNotificationCount: number;
  preview: PreviewState | null;
  page?: "home" | "about" | "calendar" | "contact" | "get-involved" | "journey";
}) {
  const isAbout = page === "about";
  const isHome = page === "home";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return (
    <header className={styles.siteHeader}>
      <a
        href={`#${page}-content`}
        className={styles.skipLink}
      >
        Skip to content
      </a>
      {preview?.active && (
        <div className={styles.previewBanner}>
          Previewing as {preview.mode === "logged_out" ? "a visitor" : preview.targetEmail}
        </div>
      )}
      <div className={styles.navInner} ref={menuRef}>
        <Link href="/" className={styles.wordmark} aria-label="Durga Bari, San Jose — home">
          <DurgaBariMark />
          <span>
            Durga Bari<small>San Jose · California</small>
          </span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Primary navigation">
          <Link href={isHome ? "#maa" : "/#maa"}>Maa & her family</Link>
          {isAbout ? (
            <Link href="/about" aria-current="page">
              Our story
            </Link>
          ) : (
            <Link href={isHome ? "#our-beginning" : "/about"}>
              {isHome ? "Our beginning" : "Our story"}
            </Link>
          )}
          <Link href="/calendar" aria-current={page === "calendar" ? "page" : undefined}>
            Calendar
          </Link>
          <Link href={isHome ? "#visit" : "/#visit"}>Visit</Link>
        </nav>
        <div className={styles.navActions}>
          <Link href={user ? "/portal" : "/login"} className={styles.memberPortal}>
            Member Portal <Arrow />
          </Link>
          <OriginalSiteLink />
          <button
            ref={toggleRef}
            type="button"
            className={`${styles.menuToggle} ${open ? styles.menuIsOpen : ""}`}
            aria-expanded={open}
            aria-controls="cinematic-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
          </button>
        </div>
        <nav
          id="cinematic-menu"
          className={styles.menuPanel}
          hidden={!open}
          aria-label="More navigation"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <Link href={isHome ? "#maa" : "/#maa"}>
            Maa & her family <Arrow />
          </Link>
          <Link href={isHome ? "#our-beginning" : "/#our-beginning"}>
            Our beginning <Arrow />
          </Link>
          <Link href="/calendar" aria-current={page === "calendar" ? "page" : undefined}>
            Calendar <Arrow />
          </Link>
          <Link href="/about" aria-current={isAbout ? "page" : undefined}>
            About Durga Bari <Arrow />
          </Link>
          <Link href="/get-involved" aria-current={page === "get-involved" ? "page" : undefined}>
            Get involved <Arrow />
          </Link>
          <Link href="/contact" aria-current={page === "contact" ? "page" : undefined}>
            Contact <Arrow />
          </Link>
          <div className={styles.menuFoot}>
            <Link href={user ? "/portal" : "/login"}>
              {user ? "Member portal" : "Member login"}
            </Link>
            <button type="button" disabled lang="bn" className={styles.languageUnavailable} title="Bengali translation is coming later">
              বাংলা
            </button>
            {showAdminLink && (
              <Link href="/admin">
                Admin{adminNotificationCount ? ` (${adminNotificationCount})` : ""}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

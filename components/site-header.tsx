"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { resolveLanguage, withLang } from "@/lib/i18n";
import { SITE_VIEW_COOKIE } from "@/lib/site-theme";
import type { SiteTheme } from "@/lib/site-theme";
import type { PortalUser, PreviewState } from "@/lib/types";

interface SiteHeaderProps {
  user: PortalUser | null;
  preview: PreviewState | null;
  showAdminLink: boolean;
  adminNotificationCount: number;
  initialTheme: SiteTheme;
}

const copy = {
  en: {
    navItems: [
      { label: "Home", href: "/" },
      { label: "Our Journey", href: "/our-sacred-journey-from-vision-to-temple/" },
      { label: "About", href: "/about" },
      { label: "Events & Festivals", href: "/events-festivals" },
      { label: "Calendar", href: "/calendar" },
      { label: "Reserve an Event", href: "/reserve-an-event" },
      { label: "Donate", href: "/join-hands-to-build-durga-bari/" },
      { label: "Projects", href: "/projects" },
      { label: "Sponsors", href: "/sponsors" },
      { label: "Contact", href: "/contact" },
      { label: "Get Involved", href: "/get-involved" },
    ],
    login: "Log in",
    memberPortal: "Member Portal",
    siteTitle: "Durgabari Bay Area",
    siteTagline: "Community • Culture • Devotion",
    durgaCenter: "The Durga Center",
    menu: "Menu",
    admin: "Admin",
    notifications: "Notifications",
    languageLabel: "বাংলা",
    themeClassic: "Classic",
    themeRevamp: "Modern",
    themeDurgacenter: "Current site",
    siteView: "Site view",
    originalSite: "Original site",
    newSite: "New site",
    account: "Account",
    guest: "Guest",
    signedInAs: "Signed in as",
    profileLabel: "Open account menu",
    signOut: "Sign out",
  },
  bn: {
    navItems: [
      { label: "হোম", href: "/" },
      { label: "আমাদের যাত্রা", href: "/our-sacred-journey-from-vision-to-temple/" },
      { label: "পরিচিতি", href: "/about" },
      { label: "ইভেন্ট ও উৎসব", href: "/events-festivals" },
      { label: "ক্যালেন্ডার", href: "/calendar" },
      { label: "ইভেন্ট বুক করুন", href: "/reserve-an-event" },
      { label: "দান", href: "/join-hands-to-build-durga-bari/" },
      { label: "প্রজেক্টস", href: "/projects" },
      { label: "স্পন্সর", href: "/sponsors" },
      { label: "যোগাযোগ", href: "/contact" },
      { label: "যুক্ত হোন", href: "/get-involved" },
    ],
    login: "লগইন",
    memberPortal: "সদস্য পোর্টাল",
    siteTitle: "দুর্গাবাড়ি বে এরিয়া",
    siteTagline: "কমিউনিটি • সংস্কৃতি • ভক্তি",
    durgaCenter: "দ্য দুর্গা সেন্টার",
    menu: "মেনু",
    admin: "অ্যাডমিন",
    notifications: "বিজ্ঞপ্তি",
    languageLabel: "English",
    themeClassic: "ক্লাসিক",
    themeRevamp: "মডার্ন",
    themeDurgacenter: "বর্তমান সাইট",
    siteView: "সাইটের ধরন",
    originalSite: "পুরনো সাইট",
    newSite: "নতুন সাইট",
    account: "অ্যাকাউন্ট",
    guest: "অতিথি",
    signedInAs: "লগইন করা আছে",
    profileLabel: "অ্যাকাউন্ট মেনু খুলুন",
    signOut: "সাইন আউট",
  },
} as const;

type SiteCopy = (typeof copy)[keyof typeof copy];

export function SiteHeader({ user, preview, showAdminLink, adminNotificationCount, initialTheme }: SiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [theme, setTheme] = useState<SiteTheme>(initialTheme);
  const durgaCenterMenuRef = useRef<HTMLDetailsElement | null>(null);
  const queryString = searchParams.toString();
  const language = useMemo(() => {
    const params = new URLSearchParams(queryString);
    return resolveLanguage(params.get("lang") ?? undefined);
  }, [queryString]);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname, queryString]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = () => {
      const nextIsDesktop = mediaQuery.matches;
      setIsDesktop(nextIsDesktop);
      if (nextIsDesktop) {
        setMenuOpen(false);
      }
    };

    updateViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  const text = copy[language];
  const displayName = user?.email?.split("@")[0] ?? text.guest;

  const toggleLanguageHref = useMemo(() => {
    const params = new URLSearchParams(queryString);
    if (language === "en") {
      params.set("lang", "bn");
    } else {
      params.delete("lang");
    }
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [language, pathname, queryString]);

  const isDurgacenterTheme = theme === "durgacenter";
  const navItems = isDurgacenterTheme ? text.navItems.filter((item) => !["Projects", "Sponsors", "প্রজেক্টস", "স্পন্সর"].includes(item.label)) : text.navItems;

  if (isDurgacenterTheme) {
    return (
      <DurgacenterHeader
        user={user}
        showAdminLink={showAdminLink}
        adminNotificationCount={adminNotificationCount}
        text={text}
        language={language}
        pathname={pathname}
        queryString={queryString}
        toggleLanguageHref={toggleLanguageHref}
        activeTheme={theme}
      />
    );
  }

  if (theme === "revamp") {
    return (
      <ModernHeader
        user={user}
        showAdminLink={showAdminLink}
        adminNotificationCount={adminNotificationCount}
        text={text}
        language={language}
        pathname={pathname}
        queryString={queryString}
        toggleLanguageHref={toggleLanguageHref}
        activeTheme={theme}
      />
    );
  }

  const toggleTheme = () => {
    const nextTheme: SiteTheme = "revamp";
    document.cookie = `${SITE_VIEW_COOKIE}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    setTheme(nextTheme);
    setMenuOpen(false);
    setAccountOpen(false);
    document.documentElement.dataset.theme = nextTheme;
    window.location.href = `${pathname}${queryString ? `?${queryString}` : ""}`;
  };

  const stopPreview = async () => {
    await fetch("/api/admin/preview", { method: "DELETE" });
    window.location.href = "/";
  };

  return (
    <header className="border-b-[3px] border-[var(--db-border-strong)] bg-[var(--db-surface)] text-[var(--db-text)] shadow-[var(--db-shadow-panel)]">
      {preview?.active ? (
        <div className="border-b border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-900">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3">
            <p>
              Preview mode: {preview.mode === "logged_out" ? "logged out visitor" : `family ${preview.targetEmail ?? ""}`}
            </p>
            <button
              type="button"
              onClick={() => void stopPreview()}
              className="rounded-md border border-amber-500 bg-white px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-50"
            >
              Stop preview
            </button>
          </div>
        </div>
      ) : null}
      <div className="border-b-[2px] border-[var(--db-border)] bg-[var(--db-panel)] px-3 py-3">
        {!isDesktop ? (
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-controls="main-site-nav"
              aria-expanded={menuOpen}
              aria-label={text.menu}
              className="inline-flex h-[38px] w-[38px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white text-[var(--db-text)]"
            >
              <span className="flex flex-col gap-1">
                <span className="block h-[2px] w-4 bg-[var(--db-text)]" />
                <span className="block h-[2px] w-4 bg-[var(--db-text)]" />
                <span className="block h-[2px] w-4 bg-[var(--db-text)]" />
              </span>
            </button>

            <div className="mr-3 flex items-center gap-2 xl:mr-5">
              <Link
                href={toggleLanguageHref}
                onClick={() => {
                  setMenuOpen(false);
                  setAccountOpen(false);
                }}
                className="inline-flex h-[38px] min-w-[86px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 text-xs font-bold text-[#111] hover:bg-[#f2f2f2]"
              >
                {text.languageLabel}
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-[38px] min-w-[96px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#111] hover:bg-[#f2f2f2]"
              >
                {text.themeRevamp}
              </button>

              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-label={text.profileLabel}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    onClick={() => setAccountOpen((value) => !value)}
                    className="inline-flex h-[38px] w-[38px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white text-[var(--db-text)] hover:bg-[#f2f2f2]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      width="22"
                      height="22"
                      style={{ display: "block" }}
                      fill="none"
                      stroke="#1f4f32"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21a8 8 0 1 0-16 0" />
                      <circle cx="12" cy="8" r="4" />
                    </svg>
                  </button>
                  <div
                    className={`${accountOpen ? "block" : "hidden"} absolute right-0 top-full z-30 w-64 pt-2`}
                    role="menu"
                  >
                    <div className="border-[2px] border-[var(--db-border)] bg-white p-3 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--db-text-soft)]">{text.account}</p>
                      <p className="mt-1 text-base font-semibold text-[var(--db-text)]">{displayName}</p>
                      <p className="mt-1 text-xs text-[var(--db-text-soft)]">
                        {text.signedInAs} {user.email}
                      </p>
                      <div className="mt-3 flex flex-col gap-2">
                        <Link
                          href={withLang("/portal", language)}
                          onClick={() => setAccountOpen(false)}
                          className="inline-flex w-full items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 py-2 font-bold text-[var(--db-text)] hover:bg-[#f2f2f2]"
                        >
                          {text.memberPortal}
                        </Link>
                        <form action="/api/auth/logout" method="post">
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 py-2 font-bold text-[var(--db-text)] hover:bg-[#f2f2f2]"
                          >
                            {text.signOut}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href={withLang("/login", language)}
                  aria-label={text.login}
                  className="inline-flex h-[38px] w-[38px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white text-[var(--db-text)] hover:bg-[#f2f2f2]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    width="22"
                    height="22"
                    style={{ display: "block" }}
                    fill="none"
                    stroke="#1f4f32"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21a8 8 0 1 0-16 0" />
                    <circle cx="12" cy="8" r="4" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
        ) : null}

        <div className="mx-auto max-w-[1240px] space-y-3 lg:flex lg:items-end lg:justify-between lg:gap-6 lg:space-y-0">
          <Link href={withLang("/", language)} className="flex min-w-0 items-center gap-3 text-left">
            <div className="grid h-12 w-12 place-items-center border-[2px] border-[#5e2600] bg-[#f6c55a] text-[26px] text-[var(--db-danger)] shadow-[0_2px_0_#4a1c00] sm:h-16 sm:w-16 sm:border-[3px] sm:text-[32px]">
              ॐ
            </div>
            <div className="min-w-0">
              <h1 className="break-words font-serif text-[clamp(1.6rem,7.2vw,2.6rem)] font-bold leading-[0.98] tracking-tight text-[#111]">
                {text.siteTitle}
              </h1>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--db-text-soft)] sm:text-[13px] sm:tracking-[0.12em]">
                {text.siteTagline}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--db-text-soft)]">
                v5.2
              </p>
            </div>
          </Link>

          {isDesktop ? (
          <div className="flex items-center justify-end gap-2 lg:flex-shrink-0">
            <Link
              href={toggleLanguageHref}
              onClick={() => {
                setMenuOpen(false);
                setAccountOpen(false);
              }}
              className="inline-flex h-[42px] min-w-[84px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-xs font-bold text-[#111] hover:bg-[#f2f2f2]"
            >
              {text.languageLabel}
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-[42px] min-w-[98px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#111] hover:bg-[#f2f2f2]"
            >
                {text.themeRevamp}
            </button>

            {user ? (
              <div
                className="relative"
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}
              >
                <button
                  type="button"
                  aria-label={text.profileLabel}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                onClick={() => setAccountOpen((value) => !value)}
                className="inline-flex h-[42px] min-w-[84px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white text-[var(--db-text)] hover:bg-[#f2f2f2]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  width="24"
                  height="24"
                  style={{ display: "block" }}
                  fill="none"
                  stroke="#1f4f32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </button>
                <div
                  className={`${accountOpen ? "block" : "hidden"} absolute right-0 top-full z-30 w-64 pt-2`}
                  role="menu"
                >
                  <div className="border-[2px] border-[var(--db-border)] bg-white p-3 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--db-text-soft)]">{text.account}</p>
                    <p className="mt-1 text-base font-semibold text-[var(--db-text)]">{displayName}</p>
                    <p className="mt-1 text-xs text-[var(--db-text-soft)]">
                      {text.signedInAs} {user.email}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Link
                        href={withLang("/portal", language)}
                        onClick={() => setAccountOpen(false)}
                        className="inline-flex w-full items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 py-2 font-bold text-[var(--db-text)] hover:bg-[#f2f2f2]"
                      >
                        {text.memberPortal}
                      </Link>
                      <form action="/api/auth/logout" method="post">
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 py-2 font-bold text-[var(--db-text)] hover:bg-[#f2f2f2]"
                        >
                          {text.signOut}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href={withLang("/login", language)}
                aria-label={text.login}
                className="inline-flex h-[42px] min-w-[84px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white text-[var(--db-text)] hover:bg-[#f2f2f2]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  width="24"
                  height="24"
                  style={{ display: "block" }}
                  fill="none"
                  stroke="#1f4f32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </Link>
            )}
          </div>
          ) : null}
        </div>
      </div>

      {isDesktop ? (
      <nav
        id="main-site-nav"
        aria-label="Main site navigation"
        className="border-b-[2px] border-[var(--db-border)] bg-[var(--db-muted)] px-3 py-2"
      >
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
          <details
            ref={durgaCenterMenuRef}
            className="relative border-[2px] border-[var(--db-border)] bg-white"
            onMouseLeave={() => {
              if (durgaCenterMenuRef.current) {
                durgaCenterMenuRef.current.open = false;
              }
            }}
          >
            <summary className="list-none cursor-pointer px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]">
              ▸ {text.durgaCenter}
            </summary>
            <div className="left-0 top-full z-20 w-full border-t-[2px] border-[var(--db-border)] bg-white lg:absolute lg:min-w-[230px]">
              <ul className="p-2">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={withLang(item.href, language)}
                      onClick={() => {
                        setMenuOpen(false);
                        if (durgaCenterMenuRef.current) {
                          durgaCenterMenuRef.current.open = false;
                        }
                      }}
                      className="block border border-transparent px-2 py-1.5 text-sm font-medium text-[#111] hover:border-[var(--db-border-soft)] hover:bg-[var(--db-muted)]"
                    >
                      • {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={withLang(item.href, language)}
              onClick={() => setMenuOpen(false)}
              className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
            >
              {item.label}
            </Link>
          ))}
          {showAdminLink && (
            <Link
              href={withLang("/admin", language)}
              onClick={() => setMenuOpen(false)}
              className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
            >
              {text.admin}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}
            </Link>
          )}
        </div>
      </nav>
      ) : null}

      {!isDesktop ? (
      <>
      <div className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-200 ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMenuOpen(false)} />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[82%] max-w-[320px] border-r-[3px] border-[var(--db-border-strong)] bg-[var(--db-panel)] p-3 shadow-[6px_0_18px_rgba(0,0,0,0.2)] transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={`${text.menu} panel`}
      >
        <div className="mb-3 flex items-center justify-between border-b-[2px] border-[var(--db-border)] pb-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center border-[2px] border-[#6b2a00] bg-[#f3b53a] text-[22px] text-[#8a1a1a]">
              ॐ
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#173724]">{text.menu}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center border-[2px] border-[var(--db-border)] bg-white text-lg leading-none text-[#173724]"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={`sheet-${item.label}`}>
              <Link
                href={withLang(item.href, language)}
                onClick={() => setMenuOpen(false)}
                className="block border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
              >
                {item.label}
              </Link>
            </li>
          ))}
          {showAdminLink ? (
            <li>
              <Link
                href={withLang("/admin/notifications", language)}
                onClick={() => setMenuOpen(false)}
                className="block border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
              >
                {text.notifications}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}
              </Link>
            </li>
          ) : null}
          {showAdminLink ? (
            <li>
              <Link
                href={withLang("/admin", language)}
                onClick={() => setMenuOpen(false)}
                className="block border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
              >
                {text.admin}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}
              </Link>
            </li>
          ) : null}
          {user ? (
            <li>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="block w-full border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-left text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
                >
                  {text.signOut}
                </button>
              </form>
            </li>
          ) : null}
        </ul>
      </aside>
      </>
      ) : null}
    </header>
  );
}

function ModernHeader({
  user,
  showAdminLink,
  adminNotificationCount,
  text,
  language,
  pathname,
  queryString,
  toggleLanguageHref,
  activeTheme,
}: {
  user: PortalUser | null;
  showAdminLink: boolean;
  adminNotificationCount: number;
  text: SiteCopy;
  language: "en" | "bn";
  pathname: string;
  queryString: string;
  toggleLanguageHref: string;
  activeTheme: SiteTheme;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = text.navItems.filter((item) => !["Projects", "Sponsors", "প্রজেক্টস", "স্পন্সর"].includes(item.label));
  const switchTheme = (nextTheme: SiteTheme) => {
    if (nextTheme === activeTheme) return;
    document.cookie = `${SITE_VIEW_COOKIE}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    window.location.href = `${pathname}${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <header className="durgacenter-header modern-site-header">
      <div className="durgacenter-header-inner">
        <Link href={withLang("/", language)} className="durgacenter-logo" onClick={() => setMenuOpen(false)}>
          <img src="https://thedurgacenter.org/wp-content/uploads/2025/09/cropped-ChatGPT-Image-Sep-16-2025-05_14_45-PM-154x145.png" alt="Durga Bari - Center for Spiritual and Cultural Excellence" />
        </Link>
        <button type="button" className="durgacenter-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label={text.menu}>☰</button>
        <nav className={`durgacenter-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary site navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={withLang(item.href, language)}
              onClick={() => setMenuOpen(false)}
              className={pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "") ? "is-current" : undefined}
              aria-current={pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "") ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          {showAdminLink ? (
            <Link href={withLang("/admin", language)} onClick={() => setMenuOpen(false)}>
              {text.admin}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}
            </Link>
          ) : null}
          {showAdminLink ? (
            <Link className="modern-mobile-notifications" href={withLang("/admin/notifications", language)} onClick={() => setMenuOpen(false)}>
              {text.notifications}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}
            </Link>
          ) : null}
          <div className="modern-mobile-site-switcher" role="group" aria-label={text.siteView}>
            <button type="button" aria-pressed={activeTheme === "durgacenter"} onClick={() => switchTheme("durgacenter")}>{text.originalSite}</button>
            <button type="button" aria-pressed={activeTheme === "revamp"} onClick={() => switchTheme("revamp")}>{text.newSite}</button>
          </div>
          <button type="button" className="modern-mobile-classic-option" onClick={() => switchTheme("classic-green")}>{text.themeClassic}</button>
          {user ? (
            <div className="modern-mobile-account">
              <span>{text.signedInAs} {user.email}</span>
              <form action="/api/auth/logout" method="post">
                <button type="submit">{text.signOut}</button>
              </form>
            </div>
          ) : null}
        </nav>
        <div className="durgacenter-tools modern-site-tools">
          <Link href={toggleLanguageHref} onClick={() => setMenuOpen(false)} className="modern-language-link">
            {text.languageLabel}
          </Link>
          <label className="modern-theme-select-label">
            <span className="sr-only">Choose site theme</span>
            <select value={activeTheme} onChange={(event: ChangeEvent<HTMLSelectElement>) => switchTheme(event.target.value as SiteTheme)} aria-label="Choose site theme">
              <option value="durgacenter">{language === "en" ? "Current" : "বর্তমান"}</option>
              <option value="revamp">{text.themeRevamp}</option>
              <option value="classic-green">{text.themeClassic}</option>
            </select>
          </label>
          {user ? (
            <details className="modern-profile-menu">
              <summary aria-label={text.profileLabel}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </summary>
              <div className="modern-profile-popover" role="menu">
                <strong>{text.account}</strong>
                <span>{user.email}</span>
                <Link href={withLang("/portal", language)}>{text.memberPortal}</Link>
                {showAdminLink ? (
                  <Link href={withLang("/admin/notifications", language)}>
                    {text.notifications}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}
                  </Link>
                ) : null}
                <form action="/api/auth/logout" method="post"><button type="submit">{text.signOut}</button></form>
              </div>
            </details>
          ) : (
            <Link href={withLang("/login", language)} className="modern-profile-button" aria-label={text.login}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 1 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function DurgacenterHeader({
  user,
  showAdminLink,
  adminNotificationCount,
  text,
  language,
  pathname,
  queryString,
  toggleLanguageHref,
  activeTheme,
}: {
  user: PortalUser | null;
  showAdminLink: boolean;
  adminNotificationCount: number;
  text: SiteCopy;
  language: "en" | "bn";
  pathname: string;
  queryString: string;
  toggleLanguageHref: string;
  activeTheme: SiteTheme;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const originalPaths = ["/", "/our-sacred-journey-from-vision-to-temple/", "/about", "/events-festivals", "/join-hands-to-build-durga-bari/", "/contact", "/get-involved"];
  const navItems = originalPaths.map((path) => {
    const item = text.navItems.find((entry) => entry.href === path)!;
    return { ...item, href: path === "/events-festivals" ? "/coming-soon-a-calendar-of-sacred-celebrations" : path === "/get-involved" ? "/be-part-of-something-sacred-and-lasting" : path };
  });
  const mobileNavItems = [navItems[0], navItems[2], navItems[1], ...navItems.slice(3)];
  const currentPath = pathname.replace(/\/$/, "") || "/";
  const switchTheme = (nextTheme: SiteTheme) => {
    if (nextTheme === activeTheme) return;
    document.cookie = `${SITE_VIEW_COOKIE}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    window.location.href = `${pathname}${queryString ? `?${queryString}` : ""}`;
  };
  const viewOptions = (
    <div className="durgacenter-view-options" role="group" aria-label={text.siteView}>
      <span>{text.siteView}</span>
      <div>
        <button type="button" aria-pressed={activeTheme === "durgacenter"} onClick={() => switchTheme("durgacenter")}>{text.originalSite}</button>
        <button type="button" aria-pressed={activeTheme === "revamp"} onClick={() => switchTheme("revamp")}>{text.newSite}</button>
      </div>
      <button type="button" className="durgacenter-classic-option" onClick={() => switchTheme("classic-green")}>{text.themeClassic}</button>
    </div>
  );

  return (
    <header className="durgacenter-header durgacenter-replica-header">
      <div className="durgacenter-header-inner">
        <Link href={withLang("/", language)} className="durgacenter-logo" onClick={() => setMenuOpen(false)}>
          <Image src="/durgacenter/logo.png" width={154} height={145} alt="Durga Bari - Center for Spiritual and Cultural Excellence" priority />
        </Link>
        <nav className="durgacenter-desktop-nav" aria-label="Primary site navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={withLang(item.href, language)} aria-current={currentPath === (item.href.replace(/\/$/, "") || "/") ? "page" : undefined}>{item.label}</Link>
          ))}
        </nav>
        <div className="durgacenter-social-links" aria-label="Social media">
          <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2"/></svg></a>
          <a href="https://www.facebook.com/profile.php?id=61582255682301" target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M13.5 20v-7h2l.3-2.5h-2.3V9c0-.7.2-1.2 1.3-1.2H16V5.5a17 17 0 0 0-2-.1c-2 0-3.3 1.2-3.3 3.4v1.7H8.5V13h2.2v7" fill="#dd183b"/></svg></a>
          <a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 5.8a8.2 8.2 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.7 1 4.2 4.2 0 0 0-7.2 3.8A11.9 11.9 0 0 1 2.9 4.6a4.2 4.2 0 0 0 1.3 5.6 4.2 4.2 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.1 0 0 1-5.2 1.8H1a12 12 0 0 0 6.5 1.9c7.8 0 12.1-6.5 12.1-12.1v-.5A8.6 8.6 0 0 0 22 5.8Z"/></svg></a>
        </div>
        <details className="durgacenter-desktop-options">
          <summary aria-label="Site options">☰</summary>
          <div className="durgacenter-desktop-options-panel">
            {viewOptions}
            <Link href={toggleLanguageHref}>{text.languageLabel}</Link>
            {user ? <Link href={withLang("/portal", language)}>{text.memberPortal}</Link> : <Link href={withLang("/login", language)}>{text.login}</Link>}
            {showAdminLink ? <Link href={withLang("/admin", language)}>{text.admin}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}</Link> : null}
            {user ? <form action="/api/auth/logout" method="post"><button type="submit">{text.signOut}</button></form> : null}
          </div>
        </details>
        <button type="button" className="durgacenter-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={text.menu}>{menuOpen ? "×" : "☰"}</button>
      </div>
      <nav className={`durgacenter-replica-mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary site navigation">
        {viewOptions}
        {mobileNavItems.map((item) => (
          <Link key={item.href} href={withLang(item.href, language)} onClick={() => setMenuOpen(false)} aria-current={currentPath === (item.href.replace(/\/$/, "") || "/") ? "page" : undefined}>{item.label}</Link>
        ))}
        <div className="durgacenter-replica-mobile-tools">
          <Link href={toggleLanguageHref} onClick={() => setMenuOpen(false)}>{text.languageLabel}</Link>
          {user ? <Link href={withLang("/portal", language)} onClick={() => setMenuOpen(false)}>{text.memberPortal}</Link> : <Link href={withLang("/login", language)} onClick={() => setMenuOpen(false)}>{text.login}</Link>}
          {showAdminLink ? <Link href={withLang("/admin", language)} onClick={() => setMenuOpen(false)}>{text.admin}{adminNotificationCount > 0 ? ` (${adminNotificationCount})` : ""}</Link> : null}
          {user ? <form action="/api/auth/logout" method="post"><button type="submit">{text.signOut}</button></form> : null}
        </div>
      </nav>
    </header>
  );
}

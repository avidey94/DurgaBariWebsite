"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { resolveLanguage, type Language, withLang } from "@/lib/i18n";
import type { PortalUser, PreviewState } from "@/lib/types";

interface SiteHeaderProps {
  user: PortalUser | null;
  preview: PreviewState | null;
}

const copy = {
  en: {
    navItems: [
      { label: "Home", href: "/" },
      { label: "Our Journey", href: "/our-sacred-journey-from-vision-to-temple/" },
      { label: "About", href: "/about" },
      { label: "Events & Festivals", href: "/events-festivals" },
      { label: "Donate", href: "/donate" },
      { label: "Projects", href: "/projects" },
      { label: "Sponsors", href: "/sponsors" },
      { label: "Contact", href: "/contact" },
      { label: "Get Involved", href: "/get-involved" },
    ],
    login: "Log in",
    memberPortal: "Member Portal",
    siteTitle: "Durgabari Bay Area",
    siteTagline: "Community • Culture • Devotion",
    searchLabel: "Search Durgabari site",
    searchPlaceholder: "Search notices, events, forms",
    searchButton: "Go",
    durgaCenter: "The Durga Center",
    menu: "Menu",
    admin: "Admin",
    languageLabel: "বাংলা",
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
      { label: "দান", href: "/donate" },
      { label: "প্রজেক্টস", href: "/projects" },
      { label: "স্পন্সর", href: "/sponsors" },
      { label: "যোগাযোগ", href: "/contact" },
      { label: "যুক্ত হোন", href: "/get-involved" },
    ],
    login: "লগইন",
    memberPortal: "সদস্য পোর্টাল",
    siteTitle: "দুর্গাবাড়ি বে এরিয়া",
    siteTagline: "কমিউনিটি • সংস্কৃতি • ভক্তি",
    searchLabel: "দুর্গাবাড়ি সাইটে খুঁজুন",
    searchPlaceholder: "নোটিশ, ইভেন্ট, ফর্ম খুঁজুন",
    searchButton: "যান",
    durgaCenter: "দ্য দুর্গা সেন্টার",
    menu: "মেনু",
    admin: "অ্যাডমিন",
    languageLabel: "English",
    account: "অ্যাকাউন্ট",
    guest: "অতিথি",
    signedInAs: "লগইন করা আছে",
    profileLabel: "অ্যাকাউন্ট মেনু খুলুন",
    signOut: "সাইন আউট",
  },
} as const;

export function SiteHeader({ user, preview }: SiteHeaderProps) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<Language>("en");
  const [queryString, setQueryString] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Next.js requires useSearchParams to be wrapped in Suspense; keep this
    // query parsing client-side so 404/not-found stays prerender-safe.
    const params = new URLSearchParams(window.location.search);
    setLanguage(resolveLanguage(params.get("lang") ?? undefined));
    setQueryString(params.toString());
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMenuOpen(false);
    }
  }, [isDesktop]);

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
                  setLanguage((current) => (current === "en" ? "bn" : "en"));
                }}
                className="inline-flex h-[38px] min-w-[86px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 text-xs font-bold text-[#111] hover:bg-[#f2f2f2]"
              >
                {text.languageLabel}
              </Link>

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

        <div className="mx-auto max-w-[1240px] space-y-3">
          <div className="hidden lg:block">
          </div>

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
                v3.5.3
              </p>
            </div>
          </Link>

          {!isDesktop ? (
          <form role="search">
            <label htmlFor="site-search" className="mb-1 block text-sm font-bold text-[var(--db-text)]">
              {text.searchLabel}
            </label>
            <div className="flex w-full max-w-[430px] border-[2px] border-[var(--db-border)] bg-white md:w-[430px]">
              <input
                id="site-search"
                type="search"
                placeholder={text.searchPlaceholder}
                className="w-full border-0 px-3 py-2 text-sm text-[#111] outline-none"
              />
              <button
                type="submit"
                className="border-l-[2px] border-[var(--db-border)] bg-[var(--db-brand)] px-3 py-2 text-xs font-bold uppercase text-white hover:bg-[var(--db-brand-2)]"
              >
                {text.searchButton}
              </button>
            </div>
          </form>
          ) : null}

          {isDesktop ? (
          <div className="mx-auto flex w-full max-w-[1120px] items-end justify-between gap-4">
            <form role="search" className="w-full max-w-[520px]">
              <label htmlFor="site-search-desktop" className="mb-1 block text-sm font-bold text-[var(--db-text)]">
                {text.searchLabel}
              </label>
              <div className="flex w-full border-[2px] border-[var(--db-border)] bg-white">
                <input
                  id="site-search-desktop"
                  type="search"
                  placeholder={text.searchPlaceholder}
                  className="w-full border-0 px-3 py-2 text-sm text-[#111] outline-none"
                />
                <button
                  type="submit"
                  className="border-l-[2px] border-[var(--db-border)] bg-[var(--db-brand)] px-3 py-2 text-xs font-bold uppercase text-white hover:bg-[var(--db-brand-2)]"
                >
                  {text.searchButton}
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2">
            <Link
              href={toggleLanguageHref}
              onClick={() => {
                setLanguage((current) => (current === "en" ? "bn" : "en"));
              }}
              className="inline-flex h-[42px] min-w-[84px] items-center justify-center border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-xs font-bold text-[#111] hover:bg-[#f2f2f2]"
            >
              {text.languageLabel}
            </Link>

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
          <details className="relative border-[2px] border-[var(--db-border)] bg-white">
            <summary className="list-none cursor-pointer px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]">
              ▸ {text.durgaCenter}
            </summary>
            <div className="left-0 top-full z-20 w-full border-t-[2px] border-[var(--db-border)] bg-white lg:absolute lg:min-w-[230px]">
              <ul className="p-2">
                {text.navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={withLang(item.href, language)}
                      onClick={() => setMenuOpen(false)}
                      className="block border border-transparent px-2 py-1.5 text-sm font-medium text-[#111] hover:border-[var(--db-border-soft)] hover:bg-[var(--db-muted)]"
                    >
                      • {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
          {text.navItems.map((item) => (
            <Link
              key={item.label}
              href={withLang(item.href, language)}
              onClick={() => setMenuOpen(false)}
              className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href={withLang("/admin", language)}
              onClick={() => setMenuOpen(false)}
              className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
            >
              {text.admin}
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
          {text.navItems.map((item) => (
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
          {user?.role === "admin" ? (
            <li>
              <Link
                href={withLang("/admin", language)}
                onClick={() => setMenuOpen(false)}
                className="block border-[2px] border-[var(--db-border)] bg-white px-3 py-2 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]"
              >
                {text.admin}
              </Link>
            </li>
          ) : null}
        </ul>
      </aside>
      </>
      ) : null}
    </header>
  );
}

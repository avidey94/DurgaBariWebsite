"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PortalUser } from "@/lib/types";

interface SiteHeaderProps {
  user: PortalUser | null;
}

type Language = "en" | "bn";
type Theme = "classic-green" | "classic-red";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Payments", href: "/portal" },
  { label: "Puja 2026", href: "#" },
  { label: "Events", href: "#" },
  { label: "Notices", href: "#" },
];

const navSections = [
  { label: "Temple", items: ["Darshan Hours", "Festival Calendar", "Priest Contact"] },
  { label: "Education", items: ["Language Class", "Balak Sangha", "Scholarship"] },
  { label: "Community", items: ["Membership", "Announcements", "Volunteer"] },
  { label: "Administration", items: ["Donor Portal", "Forms", "Committee"] },
];

export function SiteHeader({ user }: SiteHeaderProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "classic-green";
    const currentTheme = document.documentElement.dataset.theme as Theme | undefined;
    return currentTheme === "classic-red" || currentTheme === "classic-green"
      ? currentTheme
      : "classic-green";
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <header className="border-b-[3px] border-[var(--db-border-strong)] bg-[var(--db-surface)] text-[var(--db-text)] shadow-[var(--db-shadow-panel)]">
      <div
        className="border-b-[2px] border-[var(--db-border-strong)] px-3 py-2 text-white"
        style={{ backgroundImage: "linear-gradient(180deg, var(--db-brand), var(--db-brand-2))" }}
      >
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2">
          <nav aria-label="Top utility" className="flex flex-wrap items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="border border-[#00170a] bg-[#042312] px-3 py-1 text-[13px] font-semibold text-white hover:bg-[#0a3b20]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="border border-[#00170a] bg-[#0b3a20] px-2 py-1 font-semibold uppercase tracking-wide text-white">
              {user ? `${user.email} • ${user.role}` : "Public Visitor"}
            </span>
            {user ? (
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="border border-[#00170a] bg-[#9d1a1a] px-3 py-1 font-semibold text-white hover:bg-[#7f1414]"
                >
                  Log out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="border border-[#00170a] bg-[#123f86] px-3 py-1 font-semibold text-white hover:bg-[#0f3270]"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="border-b-[2px] border-[var(--db-border)] bg-[var(--db-panel)] px-3 py-3">
        <div className="mx-auto grid max-w-[1240px] gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center border-[3px] border-[#5e2600] bg-[#f6c55a] text-[32px] text-[var(--db-danger)] shadow-[0_2px_0_#4a1c00]">
              ॐ
            </div>
            <div>
              <h1 className="font-serif text-4xl font-bold leading-none tracking-tight text-[#111]">
                Durgabari Society
              </h1>
              <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--db-text-soft)]">
                Community • Culture • Devotion
              </p>
            </div>
          </div>

          <form role="search" className="md:justify-self-center">
            <label htmlFor="site-search" className="mb-1 block text-sm font-bold text-[var(--db-text)]">
              Search Durgabari site
            </label>
            <div className="flex w-full max-w-[430px] border-[2px] border-[var(--db-border)] bg-white md:w-[430px]">
              <input
                id="site-search"
                type="search"
                placeholder="Search notices, events, forms"
                className="w-full border-0 px-3 py-2 text-sm text-[#111] outline-none"
              />
              <button
                type="submit"
                className="border-l-[2px] border-[var(--db-border)] bg-[var(--db-brand)] px-3 py-2 text-xs font-bold uppercase text-white hover:bg-[var(--db-brand-2)]"
              >
                Go
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 md:justify-self-end">
            <div className="inline-flex border-[2px] border-[var(--db-border)]" role="group" aria-label="Language toggle">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
                className={`px-3 py-2 text-xs font-bold ${language === "en" ? "bg-[var(--db-brand)] text-white" : "bg-[var(--db-muted)] text-[#111]"}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("bn")}
                aria-pressed={language === "bn"}
                className={`border-l-[2px] border-[var(--db-border)] px-3 py-2 text-xs font-bold ${language === "bn" ? "bg-[var(--db-brand)] text-white" : "bg-[var(--db-muted)] text-[#111]"}`}
              >
                বাংলা
              </button>
            </div>

            <button
              type="button"
              onClick={() => setTheme(theme === "classic-green" ? "classic-red" : "classic-green")}
              className="border-[2px] border-[var(--db-border)] bg-[#f2d8a2] px-3 py-2 text-xs font-bold uppercase text-[#111] hover:bg-[#ebc57b]"
            >
              Theme
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-controls="main-site-nav"
              aria-expanded={menuOpen}
              className="inline-flex border-[2px] border-[var(--db-border)] bg-[var(--db-brand)] px-3 py-2 text-xs font-bold uppercase text-white lg:hidden"
            >
              Menu
            </button>
          </div>
        </div>
      </div>

      <nav
        id="main-site-nav"
        aria-label="Main site navigation"
        className={`${menuOpen ? "block" : "hidden"} border-b-[2px] border-[var(--db-border)] bg-[var(--db-muted)] px-3 py-2 lg:block`}
      >
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-2">
          <Link href="/" className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]">
            Home
          </Link>
          <Link href="/portal" className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]">
            Donations Portal
          </Link>
          <Link href="/login" className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]">
            Member Login
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="border-[2px] border-[var(--db-border)] bg-white px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]">
              Admin
            </Link>
          )}

          {navSections.map((section) => (
            <details key={section.label} className="relative border-[2px] border-[var(--db-border)] bg-white">
              <summary className="list-none cursor-pointer px-3 py-1.5 text-sm font-bold text-[#111] hover:bg-[#f5f5f5]">
                ▸ {section.label}
              </summary>
              <div className="left-0 top-full z-20 w-full border-t-[2px] border-[var(--db-border)] bg-white lg:absolute lg:min-w-[230px]">
                <ul className="p-2">
                  {section.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="block border border-transparent px-2 py-1.5 text-sm font-medium text-[#111] hover:border-[var(--db-border-soft)] hover:bg-[var(--db-muted)]">
                        • {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </nav>
    </header>
  );
}

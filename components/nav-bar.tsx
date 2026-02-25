import Link from "next/link";

import type { PortalUser } from "@/lib/types";

interface NavBarProps {
  user: PortalUser | null;
}

const topLinks = [
  { label: "Home", href: "/" },
  { label: "Payments & Donation", href: "/portal" },
  { label: "Puja 2026", href: "#" },
  { label: "Registration", href: "#" },
  { label: "YouTube", href: "#" },
];

const mainLinks = [
  { label: "Home", href: "/" },
  { label: "Temple", href: "#" },
  { label: "Education", href: "#" },
  { label: "Rental", href: "#" },
  { label: "Publications", href: "#" },
  { label: "Capital Projects", href: "#" },
  { label: "Puja 2026", href: "#" },
];

export function NavBar({ user }: NavBarProps) {
  return (
    <header className="shadow-sm">
      <div className="bg-gradient-to-r from-[#9d0000] via-[#c50808] to-[#9d0000] px-4 py-3 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {topLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-sm border border-black/20 bg-black/60 px-4 py-2 font-medium hover:bg-black/80"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <a href="#" className="rounded-sm bg-[#2d5ea8] px-4 py-2 font-medium hover:bg-[#234a84]">
              Facebook
            </a>
            {user ? (
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-sm border border-white/50 bg-white/10 px-4 py-2 font-medium hover:bg-white/20"
                >
                  Log out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="rounded-sm border border-white/50 bg-white/10 px-4 py-2 font-medium hover:bg-white/20"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white px-4 py-7">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#cb1717] bg-[#ffe9d0] text-xl">
              ॐ
            </div>
            <div>
              <p className="font-serif text-4xl leading-none text-[#151515]">Durgabari Society</p>
              <p className="mt-1 text-sm tracking-[0.12em] text-[#a30000]">COMMUNITY • CULTURE • DEVOTION</p>
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
            {user ? `${user.email} • ${user.role}` : "Public Visitor"}
          </div>
        </div>
      </div>

      <div className="border-y border-slate-200 bg-white px-4 py-3">
        <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 text-[22px] font-medium text-[#171717]">
          {mainLinks.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              className={index === 0 ? "text-[#cb1717]" : "hover:text-[#cb1717]"}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin" className="hover:text-[#cb1717]">
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

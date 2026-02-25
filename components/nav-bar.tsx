import Link from "next/link";

import type { PortalUser } from "@/lib/types";

interface NavBarProps {
  user: PortalUser | null;
}

export function NavBar({ user }: NavBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          Durgabari Donation Portal
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-700 hover:text-slate-900">
            Home
          </Link>
          {user ? (
            <>
              <Link href="/portal" className="text-slate-700 hover:text-slate-900">
                Portal
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-slate-700 hover:text-slate-900">
                  Admin
                </Link>
              )}
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

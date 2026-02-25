import Link from "next/link";

import { env } from "@/lib/env";

export default function Home() {
  return (
    <section className="space-y-10">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 via-white to-red-50 p-10">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-orange-700">Durgabari</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900">
          Community donation records with secure member access.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-700">
          A production-ready starter portal built with Next.js, Supabase auth integration points,
          role-based admin access, and pluggable finance data providers.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Log in
          </Link>
          <Link
            href="/portal"
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Open portal
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Auth</h2>
          <p className="mt-2 text-sm text-slate-700">
            Supabase magic link and password flows are scaffolded. DEV_LOGIN_EMAIL can bypass auth
            locally.
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Data Providers</h2>
          <p className="mt-2 text-sm text-slate-700">
            DATA_PROVIDER currently is <strong>{env.dataProvider}</strong>. Mock works now;
            Google Sheets provider is wired as a drop-in stub.
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Payments</h2>
          <p className="mt-2 text-sm text-slate-700">
            Stripe checkout route and service are scaffolded for one-time and recurring donations.
          </p>
        </article>
      </div>
    </section>
  );
}

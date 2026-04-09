import type { ReactNode } from "react";

type Tone = "green" | "red" | "gold";

export function ContentPageFrame({ children }: { children: ReactNode }) {
  return (
    <section className="db-shell content-page-frame">
      <article className="db-panel content-page-panel relative overflow-hidden p-4 md:p-6">
        <div className="content-page-glow pointer-events-none absolute inset-x-10 top-0 h-36 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.48),transparent_68%)] blur-3xl" />
        {children}
      </article>
    </section>
  );
}

export function ContentHero({
  title,
  subtitle,
  kicker,
}: {
  title: string;
  subtitle: string;
  kicker?: string;
}) {
  return (
    <header
      className="content-hero relative overflow-hidden border p-6 sm:p-8"
    >
      <div className="content-hero-glow-a pointer-events-none absolute -left-10 top-8 h-24 w-24 rounded-full bg-white/45 blur-2xl" />
      <div className="content-hero-glow-b pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#f3b53a]/20 blur-3xl" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="content-hero-icon grid h-13 w-13 shrink-0 place-items-center rounded-[18px] border border-[#6b2a00] bg-[#f3b53a] text-[26px] text-[#8a1a1a] shadow-[0_8px_18px_rgba(82,39,10,0.16)] sm:h-16 sm:w-16 sm:text-[30px]">
          ॐ
        </div>
        <div className="min-w-0">
          {kicker ? (
            <p className="content-hero-kicker text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a3a25] sm:tracking-[0.28em]">{kicker}</p>
          ) : null}
          <h1 className="content-hero-title mt-2 break-words font-serif text-[clamp(2.1rem,6vw,4rem)] font-bold leading-[1.02] text-[#1e2437]">
            {title}
          </h1>
          <p className="content-hero-subtitle mt-3 max-w-3xl text-[clamp(1rem,2vw,1.2rem)] font-medium leading-8 text-[#564536]">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}

export function ContentModule({
  title,
  tone = "green",
  children,
}: {
  title: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <section className="content-module db-card overflow-hidden">
      <div className="content-module-header relative border-b border-white/40 px-5 py-5" data-tone={tone}>
        <div className="content-module-glow pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-white/35 blur-2xl" />
        <p className="content-module-kicker db-kicker text-[0.72rem]">
          Section
        </p>
        <h2 className="content-module-title mt-2 font-serif text-[28px] font-bold leading-tight sm:text-[34px]">
          {title}
        </h2>
      </div>
      <div className="content-module-body db-prose p-5 md:p-6">{children}</div>
    </section>
  );
}

export function ContentPlaceholder({
  label,
  sublabel,
}: {
  label: string;
  sublabel: string;
}) {
  return (
    <div className="content-placeholder db-card-muted p-4">
      <div className="content-placeholder-inner grid h-44 place-items-center rounded-[var(--db-radius-sm)] border border-dashed border-[var(--db-border-soft)] bg-white/80 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4a6552]">Media Placeholder</p>
          <p className="mt-1 font-serif text-3xl font-bold text-[#173724]">{label}</p>
          <p className="text-sm text-[#35513d]">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}

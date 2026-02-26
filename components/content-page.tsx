import type { ReactNode } from "react";

type Tone = "green" | "red" | "gold";

const toneStyles: Record<Tone, { backgroundImage: string; color: string }> = {
  green: { backgroundImage: "linear-gradient(180deg,#2f6d45,#1f4f32)", color: "#ffffff" },
  red: { backgroundImage: "linear-gradient(180deg,#c91d1d,#951515)", color: "#ffffff" },
  gold: { backgroundImage: "linear-gradient(180deg,#ffe6b5,#f5cc75)", color: "#132a1f" },
};

export function ContentPageFrame({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1120px] px-4 py-6 md:py-8">
      <article className="border-[3px] border-[var(--db-border-strong)] bg-[var(--db-panel)] p-3 shadow-[inset_0_1px_0_#fff,0_2px_0_#173522] md:p-4">
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
      className="border-[2px] border-[var(--db-border)] p-4 sm:p-5"
      style={toneStyles.gold}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center border-[2px] border-[#6b2a00] bg-[#f3b53a] text-[26px] text-[#8a1a1a] sm:h-14 sm:w-14 sm:text-[30px]">
          ॐ
        </div>
        <div className="min-w-0">
          {kicker ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5b3d16] sm:text-[11px] sm:tracking-[0.2em]">{kicker}</p>
          ) : null}
          <h1 className="mt-1 break-words font-serif text-[clamp(2.2rem,13.5vw,3.75rem)] font-bold leading-[1.02] text-[#132a1f]">
            {title}
          </h1>
          <p className="mt-2 text-[clamp(1.125rem,5.1vw,1.25rem)] font-semibold leading-snug text-[#223a2d]">{subtitle}</p>
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
    <section className="border-[2px] border-[var(--db-border)] bg-[#fffef9] shadow-[inset_0_1px_0_#fff,0_1px_0_#b8c5b6]">
      <div className="border-b-[2px] border-[var(--db-border)] px-4 py-2" style={toneStyles[tone]}>
        <h2 className="font-serif text-[26px] font-bold leading-tight sm:text-[30px]">{title}</h2>
      </div>
      <div className="p-4 text-[17px] leading-8 text-[#1f2a22] md:p-5">{children}</div>
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
    <div className="border-[2px] border-[#365741] bg-[linear-gradient(180deg,#f7f2df,#e3ecd8)] p-4">
      <div className="grid h-44 place-items-center border-[2px] border-dashed border-[#4f725a] bg-white/80 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4a6552]">Media Placeholder</p>
          <p className="mt-1 font-serif text-3xl font-bold text-[#173724]">{label}</p>
          <p className="text-sm text-[#35513d]">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}

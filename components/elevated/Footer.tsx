"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { resolveLanguage, withLang } from "@/lib/i18n";
import { CmsEditableText } from "@/components/cms/CmsEditableText";

export function ElevatedFooter({ fields, isAdmin }: { fields: Record<string, string>; isAdmin: boolean }) {
  const pathname = usePathname();
  const lang = resolveLanguage(useSearchParams().get("lang") ?? undefined);
  if (/^\/(admin|portal|login|reset-password|auth)(\/|$)/.test(pathname)) return null;
  const isBn = lang === "bn";
  const field = (key: string, fallback: string, as: "p" | "h2", className?: string) => <CmsEditableText key={`revamp-footer-${lang}-${key}`} slug={`revamp-footer-${lang}-${key}`} label={`footer ${key.replace(/-/g, " ")}`} initialText={fields[`revamp-footer-${lang}-${key}`] || fallback} as={as} className={className} isAdmin={isAdmin} />;
  return (
    <footer className="elevated-footer">
      <div className="elevated-wrap elevated-footer-main">
        <div>
          {field("eyebrow", isBn ? "দুর্গা বাড়ি" : "Durga Bari", "p", "elevated-eyebrow")}
          {field("title", isBn ? "ভক্তি, সংস্কৃতি ও মানুষের মিলন।" : "A home for devotion, culture, and community.", "h2")}
        </div>
        <nav aria-label={isBn ? "ফুটার নেভিগেশন" : "Footer navigation"}>
          <Link href={withLang("/about", lang)}>{isBn ? "পরিচিতি" : "About"}</Link>
          <Link href={withLang("/calendar", lang)}>{isBn ? "ক্যালেন্ডার" : "Calendar"}</Link>
          <Link href={withLang("/get-involved", lang)}>{isBn ? "যুক্ত হোন" : "Get involved"}</Link>
          <Link href={withLang("/join-hands-to-build-durga-bari/", lang)}>{isBn ? "দান" : "Donate"}</Link>
          <Link href={withLang("/contact", lang)}>{isBn ? "যোগাযোগ" : "Contact"}</Link>
        </nav>
        <div className="elevated-footer-address"><p>2350 Paragon Dr<br />San Jose, CA 95131</p><a href="mailto:info@thedurgacenter.org">info@thedurgacenter.org</a></div>
      </div>
      <div className="elevated-wrap elevated-footer-bottom"><span>© 2026 Durga Bari – Center for Spiritual and Cultural Excellence</span><span>San Jose, California</span></div>
    </footer>
  );
}

import type { ReactNode } from "react";

import { CmsEditableText, type CmsTextTag } from "@/components/cms/CmsEditableText";
import { CmsEditableImage } from "@/components/cms/CmsEditableImage";
import { CmsEditableLink, type CmsLinkIcon } from "@/components/cms/CmsEditableLink";
import { decodeCmsText } from "@/lib/cms/cms-text";
import { getCmsPageContentsByPrefix } from "@/lib/cms/page-content";
import type { Language } from "@/lib/i18n";

export type RevampField = ((key: string, fallback: string, as?: CmsTextTag, className?: string) => ReactNode) & {
  image: (key: string, fallbackSrc: string, fallbackAlt: string, className?: string) => ReactNode;
  link: (key: string, fallback: string, href: string, className?: string, icon?: CmsLinkIcon) => ReactNode;
};

export async function getRevampFieldRenderer(page: string, lang: Language, isAdmin: boolean): Promise<RevampField> {
  const prefix = `revamp-${page}-${lang}-`;
  const rows = await getCmsPageContentsByPrefix(prefix);
  const values = new Map(rows.map((row) => [row.slug.slice(prefix.length), decodeCmsText(row.content_html)]));

  const field = ((key, fallback, as = "p", className) => (
    <CmsEditableText
      key={`${prefix}${key}`}
      slug={`${prefix}${key}`}
      label={key.replace(/-/g, " ")}
      initialText={values.get(key) || fallback}
      as={as}
      className={className}
      isAdmin={isAdmin}
    />
  )) as RevampField;

  field.image = (key, fallbackSrc, fallbackAlt, className) => {
    let src = fallbackSrc;
    let alt = fallbackAlt;
    const stored = values.get(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { src?: string; alt?: string };
        if (typeof parsed.src === "string" && parsed.src) src = parsed.src;
        if (typeof parsed.alt === "string") alt = parsed.alt;
      } catch {
        // Existing single-URL fields remain usable.
        src = stored;
      }
    }
    return <CmsEditableImage key={`${prefix}${key}`} slug={`${prefix}${key}`} label={key.replace(/-/g, " ")} initialSrc={src} initialAlt={alt} className={className} isAdmin={isAdmin} />;
  };

  field.link = (key, fallback, href, className, icon = "up-right") => <CmsEditableLink
    key={`${prefix}${key}`}
    slug={`${prefix}${key}`}
    label={key.replace(/-/g, " ")}
    initialText={values.get(key) || fallback}
    href={href}
    className={className}
    icon={icon}
    isAdmin={isAdmin}
  />;

  return field;
}

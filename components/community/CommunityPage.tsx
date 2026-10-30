import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Arrow } from "@/components/home/CinematicIcons";
import { CinematicFooter } from "@/components/home/CinematicFooter";
import styles from "./CommunityPages.module.css";

export function CommunityPage({
  children,
  page,
}: {
  children: ReactNode;
  page: "contact" | "get-involved";
}) {
  return (
    <div className={styles.page}>
      {children}
      <CinematicFooter backTo={`#${page}-content`} />
    </div>
  );
}

export function CommunityHero({
  page,
  label,
  bengali,
  title,
  lead,
  image,
  imageAlt,
  caption,
  children,
}: {
  page: "contact" | "get-involved";
  label: string;
  bengali: string;
  title: ReactNode;
  lead: string;
  image: string;
  imageAlt: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`${page}-content`}
      className={styles.hero}
      aria-labelledby={`${page}-title`}
      tabIndex={-1}
    >
      <div className={styles.heroCopy}>
        <p className={styles.breadcrumb}>
          <Link href="/">Durga Bari</Link>
          <span aria-hidden="true">/</span>
          {label}
        </p>
        <p className={styles.bengali} lang="bn">
          {bengali}
        </p>
        <h1 id={`${page}-title`}>{title}</h1>
        <p className={styles.heroLead}>{lead}</p>
        <div className={styles.actions}>{children}</div>
        <p className={styles.heroPlace}>
          <span aria-hidden="true" />
          San Jose, California · A place for all of us
        </p>
      </div>
      <figure className={styles.heroFigure}>
        <div className={styles.heroPhoto}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            quality={85}
            sizes="(max-width: 760px) 100vw, 46vw"
          />
          <span className={styles.photoCorner} aria-hidden="true" />
        </div>
        <figcaption>
          <span>{caption}</span>
          <span>Our community, our beginning</span>
        </figcaption>
      </figure>
    </section>
  );
}

export function CommunityInvitation({
  eyebrow,
  title,
  children,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <section className={styles.invitation} aria-labelledby="invitation-title">
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 id="invitation-title">{title}</h2>
      <p className={styles.invitationBody}>{children}</p>
      <div className={styles.actions}>
        <Link href={primaryHref} className={styles.solidButton}>
          {primaryLabel}
          <Arrow diagonal />
        </Link>
        <Link href={secondaryHref} className={styles.textLink}>
          {secondaryLabel}
          <Arrow />
        </Link>
      </div>
    </section>
  );
}

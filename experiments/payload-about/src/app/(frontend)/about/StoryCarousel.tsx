"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Page } from "@/payload-types";
import styles from "./StoryCarousel.module.css";

type CarouselBlock = Extract<NonNullable<Page["layout"]>[number], { blockType: "storyCarousel" }>;

function safeImage(value?: string | null) {
  return value && ((value.startsWith("/") && !value.startsWith("//")) || value.startsWith("https://")) ? value : undefined;
}

function safeLink(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return `${url.pathname}${url.search}${url.hash}`;
    return url.protocol === "https:" ? value : null;
  } catch { return null; }
}

function Arrow({ direction }: { direction: "previous" | "next" }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={direction === "next" ? "M4 12h15m-6-6 6 6-6 6" : "M20 12H5m6-6-6 6 6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function StoryCarousel({ block, number }: { block: CarouselBlock; number: number }) {
  const cards = block.cards || [];
  const headingId = useId();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const current = Math.min(active, Math.max(cards.length - 1, 0));

  useEffect(() => {
    if (active < cards.length) return;
    setActive(Math.max(cards.length - 1, 0));
  }, [active, cards.length]);

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(index, cards.length - 1));
    setActive(next);
    track.current?.scrollTo({
      left: next * track.current.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return <section className={styles.section} aria-roledescription="carousel" aria-labelledby={headingId}>
    <div className={styles.heading}>
      <div><span className={styles.index}>{String(number).padStart(2, "0")}</span>{block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}<h2 id={headingId}>{block.headline}</h2></div>
      {block.introduction && <p className={styles.introduction}>{block.introduction}</p>}
    </div>
    <div className={styles.track} ref={track} onScroll={(event) => {
      const element = event.currentTarget;
      if (element.clientWidth) setActive(Math.max(0, Math.min(cards.length - 1, Math.round(element.scrollLeft / element.clientWidth))));
    }}>
      {!cards.length && <div className={styles.empty}>Add at least two slides to preview this section.</div>}
      {cards.map((card, index) => {
        const image = safeImage(card.imageUrl);
        const link = card.linkLabel ? safeLink(card.linkUrl) : null;
        return <article className={styles.slide} key={card.id || index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${cards.length}`} inert={index !== current}>
          <div className={styles.copy}>
            {card.label && <span className={styles.label}>{card.label}</span>}
            <div className={styles.copyBottom}><h3>{card.headline}</h3>{card.body && <p>{card.body}</p>}{link && <a href={link}>{card.linkLabel} <Arrow direction="next" /></a>}</div>
          </div>
          <div className={styles.media}>{image && <img src={image} alt={card.imageAlt || ""} loading={index === 0 ? "eager" : "lazy"} />}</div>
        </article>;
      })}
    </div>
    {cards.length > 0 &&
    <div className={styles.controls}>
      <span className={styles.count}>{String(current + 1).padStart(2, "0")} <span>/ {String(cards.length).padStart(2, "0")}</span></span>
      <div className={styles.dots} role="group" aria-label="Choose a slide">{cards.map((card, index) => <button key={card.id || index} type="button" className={index === current ? styles.dotActive : styles.dot} aria-label={`Show slide ${index + 1}: ${card.headline}`} aria-current={index === current ? "true" : undefined} onClick={() => goTo(index)} />)}</div>
      <div className={styles.arrows}><button type="button" aria-label="Previous slide" disabled={current === 0} onClick={() => goTo(current - 1)}><Arrow direction="previous" /></button><button type="button" aria-label="Next slide" disabled={current === cards.length - 1} onClick={() => goTo(current + 1)}><Arrow direction="next" /></button></div>
    </div>}
  </section>;
}

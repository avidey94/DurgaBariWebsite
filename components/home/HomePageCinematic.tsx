"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { Arrow, Trishul } from "./CinematicIcons";
import { CinematicFooter } from "./CinematicFooter";
import styles from "./HomePageCinematic.module.css";

const deities = [
  {
    id: "durga",
    name: "Maa Durga",
    bengali: "মা দুর্গা",
    role: "The Divine Mother",
    blessing: "Strength. Protection. Hope.",
    body: "At the heart of Durga Puja is Maa Durga: the mother who protects, the warrior who overcomes evil. At the heart of our new home in San Jose is our devotion to her.",
    x: 47,
    y: 63,
  },
  {
    id: "lakshmi",
    name: "Lakshmi",
    bengali: "লক্ষ্মী",
    role: "Goddess of prosperity",
    blessing: "Prosperity, shared with others.",
    body: "Lakshmi represents wealth, good fortune, and abundance. Her presence invites us to think of prosperity as something that nourishes our families and the community around us.",
    x: 23,
    y: 65,
  },
  {
    id: "saraswati",
    name: "Saraswati",
    bengali: "সরস্বতী",
    role: "Goddess of knowledge & the arts",
    blessing: "Wisdom for the next generation.",
    body: "Saraswati represents knowledge, learning, music, and the arts. She inspires our hope for a place where children can discover their language, express themselves, and grow close to their heritage.",
    x: 76,
    y: 69,
  },
  {
    id: "ganesha",
    name: "Ganesha",
    bengali: "গণেশ",
    role: "Remover of obstacles",
    blessing: "Grace in every beginning.",
    body: "Ganesha is honored as the remover of obstacles and the god of auspicious beginnings. As Durga Bari takes its first steps, his presence is a fitting reminder to begin with humility and care.",
    x: 19,
    y: 86,
  },
  {
    id: "kartikeya",
    name: "Kartikeya",
    bengali: "কার্তিক",
    role: "God of courage & victory",
    blessing: "The courage to carry it forward.",
    body: "Kartikeya, also known as Skanda, represents courage, action, and victory. His resolve inspires the patient, collective effort of building a spiritual home for generations to come.",
    x: 75,
    y: 91,
  },
] as const;

const familyCredit =
  "https://commons.wikimedia.org/wiki/File:Durga_Idol_with_Traditional_Decoration.jpg";

function subscribeSystemMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getSystemMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerMotion = () => false;
const subscribeSavedMotion = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};
function getSavedMotion() {
  try {
    return localStorage.getItem("db-reduce-motion") === "true";
  } catch {
    return false;
  }
}

export function HomePageCinematic() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const familyRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewerTriggerRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState(0);
  const [manualOverride, setManualReduced] = useState<boolean | null>(null);
  const savedMotion = useSyncExternalStore(subscribeSavedMotion, getSavedMotion, getServerMotion);
  const manualReduced = manualOverride ?? savedMotion;
  const systemReduced = useSyncExternalStore(subscribeSystemMotion, getSystemMotion, getServerMotion);
  const reduced = manualReduced || systemReduced;
  const deity = deities[selected];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    root.dataset.enhanced = "true";
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = heroRef.current?.getBoundingClientRect();
      const family = familyRef.current?.getBoundingClientRect();
      if (hero && hero.bottom > 0)
        root.style.setProperty(
          "--hero-scroll",
          String(Math.min(1, Math.max(0, -hero.top / hero.height))),
        );
      if (family) {
        const progress = Math.min(
          1,
          Math.max(0, (80 - family.top) / Math.max(1, family.height - window.innerHeight)),
        );
        root.style.setProperty("--family-reveal", String(progress));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  function toggleMotion() {
    const next = !manualReduced;
    setManualReduced(next);
    try {
      localStorage.setItem("db-reduce-motion", String(next));
    } catch {
      /* Optional preference. */
    }
  }

  function changeTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % deities.length;
    else if (event.key === "ArrowLeft") next = (index + deities.length - 1) % deities.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = deities.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    document.getElementById(`deity-tab-${deities[next].id}`)?.focus();
  }

  function openViewer() {
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
  }

  function closeViewer() {
    dialogRef.current?.close();
  }

  return (
    <div
      ref={rootRef}
      className={`${styles.page} db-cinema`}
      data-motion={reduced ? "reduced" : "full"}
    >
      <section
        ref={heroRef}
        id="home-content"
        className={styles.hero}
        aria-labelledby="home-title"
        tabIndex={-1}
      >
        <div className={styles.heroImage}>
          <Image
            src="/home/maa-durga.jpg"
            alt="Maa Durga’s golden crown and serene face, photographed at Durga Bari in San Jose"
            fill
            priority
            sizes="(max-width: 700px) 100vw, 68vw"
            quality={90}
          />
        </div>
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.liveDot} /> A new beginning · San Jose, California
          </p>
          <p className={styles.bengaliGreeting} lang="bn">
            জয় মা দুর্গা
          </p>
          <h1 id="home-title">
            Where Maa is,
            <br />
            we are <em>home.</em>
          </h1>
          <p className={styles.heroLead}>
            A spiritual home taking shape in the Bay Area.
            <br className={styles.desktopBreak} /> Rooted in Maa Durga. Built together, with love.
          </p>
          <a className={styles.lightButton} href="#maa">
            Step inside <Arrow />
          </a>
        </div>
        <div className={styles.heroBottom}>
          <a href="#maa" className={styles.scrollCue}>
            <span className={styles.scrollLine} /> Scroll to discover
          </a>
          <span className={styles.heroCaption}>Maa Durga at our San Jose home</span>
          <button
            type="button"
            className={styles.motionToggle}
            onClick={toggleMotion}
            disabled={systemReduced}
            aria-pressed={reduced}
            title={
              systemReduced
                ? "Reduced motion follows your device setting"
                : "Reduce page animations"
            }
          >
            <span className={styles.motionGlyph} aria-hidden="true">
              {reduced ? "Ⅱ" : "▷"}
            </span>{" "}
            Motion {reduced ? "reduced" : "on"}
          </button>
        </div>
      </section>

      <section className={styles.invocation} aria-labelledby="invocation-title">
        <div className={styles.sectionMark} data-reveal>
          <Trishul />
        </div>
        <p className={styles.eyebrow} data-reveal>
          Our devotion. Our reason for being.
        </p>
        <h2 id="invocation-title" data-reveal>
          Before a temple is built,
          <br />a home begins <em>in the heart.</em>
        </h2>
        <p className={styles.invocationBody} data-reveal>
          We are a growing community in San Jose, coming together in devotion to Maa Durga. With
          every prayer, every gathering, and every helping hand, we are creating a place to belong.
        </p>
        <a href="#our-beginning" className={styles.textLink} data-reveal>
          Get to know Durga Bari <Arrow diagonal />
        </a>
        <span className={styles.invocationLine} aria-hidden="true" />
      </section>

      <section
        id="maa"
        ref={familyRef}
        className={styles.familyChapter}
        aria-labelledby="family-title"
      >
        <div className={styles.familySticky}>
          <div className={styles.familyHeading}>
            <div>
              <p className={styles.eyebrow}>At the heart of Durga Puja</p>
              <h2 id="family-title">
                The Mother.
                <br />
                <em>And her family.</em>
              </h2>
            </div>
            <p>
              In the Bengali tradition, Maa Durga is welcomed with Lakshmi, Saraswati, Ganesha, and
              Kartikeya. Discover the blessings each brings.
            </p>
          </div>
          <div className={styles.familyExperience}>
            <div className={styles.familyStage}>
              <div className={styles.familyCanvas}>
                <Image
                  className={styles.familyPhoto}
                  src="/home/divine-family.jpg"
                  alt="A traditional Durga Puja tableau, with Durga at the center, Lakshmi and Ganesha to the viewer’s left, Saraswati and Kartikeya to the right"
                  fill
                  sizes="(max-width: 800px) 100vw, 68vw"
                  quality={85}
                />
                {deities.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`${styles.hotspot} ${selected === index ? styles.hotspotActive : ""}`}
                    style={{ "--spot-x": `${item.x}%`, "--spot-y": `${item.y}%` } as CSSProperties}
                    aria-label={`Explore ${item.name}`}
                    aria-pressed={selected === index}
                    onClick={() => setSelected(index)}
                  >
                    <span aria-hidden="true">{selected === index ? "−" : "+"}</span>
                    <span className={styles.hotspotLabel}>{item.name}</span>
                  </button>
                ))}
              </div>
              <div className={styles.stageVignette} />
              <span className={styles.stageLabel}>A traditional Durga Puja tableau</span>
              <button
                type="button"
                ref={viewerTriggerRef}
                className={styles.expandButton}
                onClick={openViewer}
                aria-label="View the complete Durga Puja photograph"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className={styles.deityAside}>
              <div
                className={styles.deityTabs}
                role="tablist"
                aria-label="Explore the five deities"
              >
                {deities.map((item, index) => (
                  <button
                    type="button"
                    role="tab"
                    key={item.id}
                    id={`deity-tab-${item.id}`}
                    aria-selected={selected === index}
                    aria-controls="deity-panel"
                    tabIndex={selected === index ? 0 : -1}
                    onClick={() => setSelected(index)}
                    onKeyDown={(event) => changeTab(event, index)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div
                id="deity-panel"
                className={styles.deityPanel}
                role="tabpanel"
                aria-labelledby={`deity-tab-${deity.id}`}
                tabIndex={0}
              >
                <div
                  key={deity.id}
                  className={styles.deityContent}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className={styles.deityNumber}>
                    <span>0{selected + 1}</span>
                    <span>/ 05</span>
                  </div>
                  <p className={styles.deityBengali} lang="bn">
                    {deity.bengali}
                  </p>
                  <h3>{deity.name}</h3>
                  <p className={styles.deityRole}>{deity.role}</p>
                  <span className={styles.shortRule} />
                  <h4>{deity.blessing}</h4>
                  <p className={styles.deityBody}>{deity.body}</p>
                </div>
                <div className={styles.deityNavigation}>
                  <span>Select a name or a point on the image</span>
                  <button
                    type="button"
                    aria-label={`Next: ${deities[(selected + 1) % 5].name}`}
                    onClick={() => setSelected((selected + 1) % 5)}
                  >
                    <Arrow />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.familyFootnote}>
            <span>One family. Many blessings. Maa Durga at the center.</span>
            <a href={familyCredit} target="_blank" rel="noreferrer">
              Photograph: ARI · CC BY-SA 4.0 <Arrow diagonal />
            </a>
          </div>
        </div>
      </section>

      <section id="our-beginning" className={styles.beginning} aria-labelledby="beginning-title">
        <div className={styles.beginningIntro} data-reveal>
          <p className={styles.eyebrow}>This is our beginning</p>
          <h2 id="beginning-title">
            Bengal in our hearts.
            <br />
            <em>A home in the Bay.</em>
          </h2>
          <div className={styles.beginningBody}>
            <p>
              Some of us grew up with the sound of the dhaak. Some are discovering these traditions
              for the first time. Here, we have a chance to carry them forward together.
            </p>
            <p>
              Durga Bari is just getting started. Our vision is a permanent temple and cultural
              center: a place for worship, Bengali heritage, learning, and service, with Maa Durga
              at its heart.
            </p>
            <Link href="/our-sacred-journey-from-vision-to-temple/" className={styles.textLink}>
              Follow our journey <Arrow diagonal />
            </Link>
          </div>
        </div>
        <div className={styles.communityImages} data-reveal>
          <figure className={styles.communityWide}>
            <Image
              src="/home/community-gathering.jpeg"
              alt="Durga Bari community members taking part in an early gathering at Saratoga Library"
              fill
              sizes="(max-width: 700px) 90vw, 62vw"
            />
            <figcaption>Our first steps, together.</figcaption>
          </figure>
          <figure className={styles.communityPortrait}>
            <Image
              src="/home/community-together.jpeg"
              alt="Families and community members gathered to help shape Durga Bari’s future"
              fill
              sizes="(max-width: 700px) 60vw, 32vw"
            />
            <figcaption>The people making a home possible.</figcaption>
          </figure>
        </div>
      </section>

      <section id="gather" className={styles.sharedHome} aria-labelledby="shared-title">
        <div className={styles.sharedHeading} data-reveal>
          <p className={styles.eyebrow}>What we are building toward</p>
          <h2 id="shared-title">
            A place for prayer.
            <br />
            <em>And everything it brings together.</em>
          </h2>
        </div>
        <div className={styles.homeThreads}>
          <Link href="/calendar" className={styles.thread} data-reveal>
            <span className={styles.threadNumber}>01 / Devotion</span>
            <h3>Gather around Maa.</h3>
            <p>Puja, prayer, and the joy of celebrating our sacred festivals as a community.</p>
            <span className={styles.threadLink}>
              Explore events & festivals <Arrow diagonal />
            </span>
          </Link>
          <Link href="/about" className={styles.thread} data-reveal>
            <span className={styles.threadNumber}>02 / Heritage</span>
            <h3>Carry a little Bengal.</h3>
            <p>
              A vision for language, music, art, and stories that connect our children to their
              roots.
            </p>
            <span className={styles.threadLink}>
              Discover our vision <Arrow diagonal />
            </span>
          </Link>
          <Link href="/get-involved" className={styles.thread} data-reveal>
            <span className={styles.threadNumber}>03 / Seva</span>
            <h3>Make room for others.</h3>
            <p>
              Bring your time, your skills, or simply your willingness to help. This home grows
              through all of us.
            </p>
            <span className={styles.threadLink}>
              Find your way to contribute <Arrow diagonal />
            </span>
          </Link>
        </div>
      </section>

      <section className={styles.buildInvitation} aria-labelledby="build-title">
        <div className={styles.buildImage}>
          <Image
            src="/durgacenter/maa-durga-inauguration.jpg"
            alt="A priest offering worship to Maa Durga at Durga Bari’s inaugural puja"
            fill
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        </div>
        <div className={styles.buildCopy} data-reveal>
          <p className={styles.eyebrow}>A shared dream. An open invitation.</p>
          <h2 id="build-title">
            Her home.
            <br />
            <em>Our hands.</em>
          </h2>
          <p>
            We have begun with devotion and a community willing to show up. Help us take the next
            step toward a lasting home for Maa Durga in San Jose.
          </p>
          <Link href="/join-hands-to-build-durga-bari/" className={styles.lightButton}>
            Be part of the beginning <Arrow diagonal />
          </Link>
          <Link href="/get-involved" className={styles.buildVolunteer}>
            Give your time. Share your talents. <Arrow />
          </Link>
        </div>
      </section>

      <section id="visit" className={styles.visit} aria-labelledby="visit-title">
        <div data-reveal>
          <p className={styles.eyebrow}>Find us in San Jose</p>
          <h2 id="visit-title">
            Come with devotion.
            <br />
            <em>Leave feeling at home.</em>
          </h2>
          <p>
            New to the Bay Area, or simply new to Durga Bari?
            <br />
            We would love to meet you.
          </p>
        </div>
        <div className={styles.visitDetails} data-reveal>
          <span className={styles.visitPin} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </span>
          <address>
            2350 Paragon Drive
            <br />
            San Jose, California 95131
          </address>
          <a
            href="https://maps.google.com/?q=2350+Paragon+Dr,+San+Jose,+CA+95131"
            target="_blank"
            rel="noreferrer"
            className={styles.textLink}
          >
            Get directions <Arrow diagonal />
          </a>
          <p>
            As our community grows, gathering times vary.
            <br />
            <Link href="/calendar">See upcoming events</Link> or{" "}
            <Link href="/contact">get in touch</Link> before visiting.
          </p>
        </div>
      </section>

      <CinematicFooter />

      <dialog
        ref={dialogRef}
        className={styles.photoDialog}
        aria-labelledby="photo-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer();
        }}
        onClose={() => {
          document.body.style.overflow = "";
          viewerTriggerRef.current?.focus();
        }}
      >
        <div className={styles.dialogInner}>
          <div className={styles.dialogBar}>
            <h2 id="photo-dialog-title">Maa Durga & her family</h2>
            <button type="button" onClick={closeViewer} aria-label="Close photograph" autoFocus>
              Close <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className={styles.dialogPhoto}>
            <Image
              src="/home/divine-family.jpg"
              alt="The complete Durga Puja tableau with all five deities"
              fill
              sizes="100vw"
              quality={90}
            />
          </div>
          <p>
            A traditional Durga Puja tableau in West Bengal. Photograph by{" "}
            <a href={familyCredit} target="_blank" rel="noreferrer">
              ARI
            </a>
            , licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY-SA 4.0
            </a>
            . Display crops vary; original photograph unaltered.
          </p>
        </div>
      </dialog>
    </div>
  );
}

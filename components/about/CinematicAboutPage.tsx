"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Arrow, Trishul } from "@/components/home/CinematicIcons";
import { CinematicFooter } from "@/components/home/CinematicFooter";
import styles from "./CinematicAboutPage.module.css";

const chapters = [
  { id: "our-purpose", label: "Our purpose" },
  { id: "our-commitments", label: "What guides us" },
  { id: "our-beginning", label: "Where we are" },
  { id: "our-vision", label: "The home we envision" },
] as const;

const commitments = [
  {
    title: "Keep worship sacred.",
    body: "We seek a space shaped by humility and devotion, with worship free of political agendas, personal ego, and division. Maa Durga is our shared center.",
  },
  {
    title: "Carry our heritage forward.",
    body: "Our traditions live when we practice and share them. We want to make room for the festivals, arts, language, and stories that connect generations to their Bengali roots.",
  },
  {
    title: "Come together as one family.",
    body: "Under Maa Durga’s blessings, we hope to build lasting connections across ages and backgrounds. Devotees, volunteers, and well-wishers all have a place in this beginning.",
  },
] as const;

const vision = [
  {
    title: "A place to pray.",
    label: "Worship & spiritual growth",
    body: "We envision a lasting sacred home where people can worship Maa Durga, observe pujas, and find time for prayer and spiritual growth. A place to return to through the rhythms of life.",
    image: "/durgacenter/maa-durga-inauguration.jpg",
    alt: "A priest offering worship to Maa Durga at Durga Bari’s inaugural puja",
    caption: "Our inaugural worship in San Jose",
    position: "50% 36%",
  },
  {
    title: "A tradition to carry.",
    label: "Culture & festivals",
    body: "A home for celebrating Bengali heritage together: festivals that bring families back, music and art that invite participation, and traditions that gain new meaning when we share them.",
    image: "/home/community-gathering.jpeg",
    alt: "Community members listening and sharing ideas at an early Durga Bari gathering",
    caption: "Listening and sharing at our early community gatherings",
    position: "50% 50%",
  },
  {
    title: "A new generation to inspire.",
    label: "Youth & learning",
    body: "We hope to give young people a welcoming way into their heritage through language, the arts, and the stories behind our traditions. A place to ask questions, learn from one another, and feel a sense of belonging.",
    image: "/home/community-together.jpeg",
    alt: "Durga Bari community members gathering to help shape the center’s future",
    caption: "The community helping shape what comes next",
    position: "65% 50%",
  },
  {
    title: "A community to belong to.",
    label: "Gathering & service",
    body: "Our vision includes everyday connections alongside sacred celebrations. A place to meet neighbors, share skills, offer a helping hand, and take part in the patient work of building a home together.",
    image: "/home/community-gathering.jpeg",
    alt: "People coming together for one of Durga Bari’s first community meetings",
    caption: "Coming together around a shared vision",
    position: "25% 50%",
  },
] as const;

export function CinematicAboutPage() {
  const root = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState<string>(chapters[0].id);
  const [activeVision, setActiveVision] = useState(0);
  const selected = vision[activeVision];

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      let saved = false;
      try {
        saved = localStorage.getItem("db-reduce-motion") === "true";
      } catch {
        /* Optional preference. */
      }
      element.dataset.motion = media.matches || saved ? "reduced" : "full";
    };
    syncMotion();
    media.addEventListener("change", syncMotion);
    window.addEventListener("storage", syncMotion);

    const reveals = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            reveals.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    element.querySelectorAll("[data-reveal]").forEach((item) => reveals.observe(item));
    element.dataset.enhanced = "true";

    const sections = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveChapter(entry.target.id);
        });
      },
      { rootMargin: "-22% 0px -58% 0px", threshold: 0 },
    );
    chapters.forEach(({ id }) => {
      const target = document.getElementById(id);
      if (target) sections.observe(target);
    });
    return () => {
      reveals.disconnect();
      sections.disconnect();
      media.removeEventListener("change", syncMotion);
      window.removeEventListener("storage", syncMotion);
    };
  }, []);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % vision.length;
    else if (event.key === "ArrowUp") next = (index + vision.length - 1) % vision.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = vision.length - 1;
    else return;
    event.preventDefault();
    document.getElementById(`vision-trigger-${next}`)?.focus();
  }

  return (
    <div ref={root} className={styles.page}>
      <section
        id="about-content"
        className={styles.hero}
        aria-labelledby="about-title"
        tabIndex={-1}
      >
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <Link href="/">Durga Bari</Link>
            <span aria-hidden="true">/</span>Our story
          </p>
          <p className={styles.bengali} lang="bn">
            মায়ের বাড়ি, আমাদের বাড়ি।
          </p>
          <h1 id="about-title">
            For Maa.
            <br />
            <em>For all of us.</em>
          </h1>
          <p className={styles.heroLead}>
            A community-led spiritual and cultural home, taking shape in San Jose under the
            blessings of Maa Durga.
          </p>
          <a href="#our-purpose" className={styles.textLink}>
            Discover what brings us together <Arrow />
          </a>
          <div className={styles.heroPlace}>
            <span className={styles.placeLine} />
            San Jose, California<span className={styles.placeDot}>·</span>A new beginning
          </div>
        </div>
        <figure className={styles.heroFigure}>
          <div className={styles.heroPhoto}>
            <Image
              src="/durgacenter/maa-durga-inauguration.jpg"
              alt="Maa Durga and a priest offering worship at Durga Bari’s inaugural puja in San Jose"
              fill
              priority
              loading="eager"
              quality={85}
              sizes="(max-width: 700px) 100vw, 48vw"
            />
          </div>
          <figcaption>
            <span>Devotion is where our story begins.</span>
            <span>Our inaugural worship</span>
          </figcaption>
        </figure>
      </section>

      <nav className={styles.chapterNav} aria-label="About page chapters">
        <div>
          {chapters.map((chapter, index) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              aria-current={activeChapter === chapter.id ? "location" : undefined}
            >
              <span>0{index + 1}</span>
              {chapter.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="our-purpose" className={styles.purpose} aria-labelledby="purpose-title">
        <div className={styles.chapterLabel} data-reveal>
          <span>01</span>
          <p className={styles.eyebrow}>Our purpose</p>
          <Trishul />
        </div>
        <div className={styles.purposeCopy} data-reveal>
          <p className={styles.fullName}>Durga Bari — Center for Spiritual & Cultural Excellence</p>
          <h2 id="purpose-title">
            Rooted in devotion.
            <br />
            <em>Made real by people.</em>
          </h2>
          <p>
            We are a growing sacred and cultural community dedicated to Maa Durga. Here in the Bay
            Area, we are bringing worship, Bengali heritage, and the simple act of coming together
            into one shared home.
          </p>
          <p>
            Our vision reaches across generations: a place for prayer and spiritual growth, for
            cultural life and learning, and for the connections that turn a gathering of people into
            a community.
          </p>
        </div>
      </section>

      <section
        id="our-commitments"
        className={styles.commitments}
        aria-labelledby="commitments-title"
      >
        <div className={styles.commitmentInner}>
          <div className={styles.commitmentHeading} data-reveal>
            <p className={styles.eyebrow}>02 / What guides us</p>
            <h2 id="commitments-title">
              What we keep
              <br />
              <em>at the center.</em>
            </h2>
            <p>
              Three commitments from our founding vision. A shared direction for the home we are
              building.
            </p>
            <span className={styles.commitmentRule} />
          </div>
          <div className={styles.commitmentList}>
            {commitments.map((item, index) => (
              <article key={item.title} data-reveal>
                <span className={styles.commitmentNumber}>0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="our-beginning" className={styles.beginning} aria-labelledby="beginning-title">
        <div className={styles.beginningHeading} data-reveal>
          <p className={styles.eyebrow}>03 / Where we are today</p>
          <h2 id="beginning-title">
            The first prayers.
            <br />
            <em>The first foundations.</em>
          </h2>
        </div>
        <div className={styles.beginningGrid}>
          <figure className={styles.beginningFigure} data-reveal>
            <div>
              <Image
                src="/home/community-gathering.jpeg"
                alt="The Durga Bari community taking part in an early gathering at Saratoga Library"
                fill
                sizes="(max-width: 700px) 100vw, 55vw"
              />
            </div>
            <figcaption>Before a permanent home, a community willing to come together.</figcaption>
          </figure>
          <div className={styles.beginningCopy} data-reveal>
            <p className={styles.phaseBadge}>
              <span />
              Our Initiation Phase
            </p>
            <p className={styles.beginningLead}>
              Our inaugural worship marked the beginning of a living sacred space for the community.
            </p>
            <p>
              We are strengthening our spiritual and organizational foundations as we work toward a
              permanent temple and cultural center. Each gathering, each offer of help, and each
              shared responsibility is part of that foundation.
            </p>
            <Link href="/our-sacred-journey-from-vision-to-temple/" className={styles.textLink}>
              Explore our sacred journey <Arrow diagonal />
            </Link>
          </div>
        </div>
        <ol
          className={styles.journeyLine}
          aria-label="Our path toward a permanent home"
          data-reveal
        >
          <li>
            <span className={styles.journeyDot} />
            <p className={styles.eyebrow}>Our foundation</p>
            <h3>A shared vision</h3>
            <p>Community conversations and the first gatherings.</p>
          </li>
          <li className={styles.currentPhase} aria-current="step">
            <span className={styles.journeyDot} />
            <p className={styles.eyebrow}>Where we are now</p>
            <h3>A living sacred space</h3>
            <p>Inaugural worship and a growing community.</p>
          </li>
          <li>
            <span className={styles.journeyDot} />
            <p className={styles.eyebrow}>Our long-term vision</p>
            <h3>A permanent home</h3>
            <p>A temple and cultural center for generations to come.</p>
          </li>
        </ol>
      </section>

      <section id="our-vision" className={styles.vision} aria-labelledby="vision-title">
        <div className={styles.visionHeading} data-reveal>
          <div>
            <p className={styles.eyebrow}>04 / The home we envision</p>
            <h2 id="vision-title">
              A temple at its heart.
              <br />
              <em>A whole community around it.</em>
            </h2>
          </div>
          <p>
            These are the possibilities we are working toward. Explore what a lasting home could
            hold.
          </p>
        </div>
        <div className={styles.visionExperience} data-reveal>
          <figure className={styles.visionFigure}>
            <div className={styles.visionImage} key={selected.image + selected.position}>
              <Image
                src={selected.image}
                alt={selected.alt}
                fill
                quality={85}
                loading="eager"
                sizes="(max-width: 800px) 100vw, 52vw"
                style={{ objectPosition: selected.position }}
              />
            </div>
            <figcaption>
              <span>0{activeVision + 1} / 04</span>
              <span>{selected.caption}</span>
            </figcaption>
          </figure>
          <div className={styles.visionAccordion}>
            {vision.map((item, index) => (
              <section key={item.label} className={activeVision === index ? styles.visionOpen : ""}>
                <h3>
                  <button
                    type="button"
                    id={`vision-trigger-${index}`}
                    aria-expanded={activeVision === index}
                    aria-controls={`vision-panel-${index}`}
                    onClick={() => setActiveVision(index)}
                    onKeyDown={(event) => moveFocus(event, index)}
                  >
                    <span className={styles.visionNumber}>0{index + 1}</span>
                    <span>{item.label}</span>
                    <span className={styles.visionPlus} aria-hidden="true">
                      {activeVision === index ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={`vision-panel-${index}`}
                  role="region"
                  aria-labelledby={`vision-trigger-${index}`}
                  hidden={activeVision !== index}
                  className={styles.visionPanel}
                >
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </section>
            ))}
          </div>
        </div>
        <p className={styles.visionNote}>
          Photographs from our own worship and early gatherings. Programs described here are part of
          our vision for the future.
        </p>
      </section>

      <section className={styles.invitation} aria-labelledby="invitation-title">
        <p className={styles.eyebrow} data-reveal>
          This beginning belongs to all of us
        </p>
        <h2 id="invitation-title" data-reveal>
          A home grows
          <br />
          <em>when people show up.</em>
        </h2>
        <p className={styles.invitationBody} data-reveal>
          Come as a devotee, volunteer, or well-wisher. Bring an idea, a question, or a willingness
          to help. There is a place for you in this story.
        </p>
        <div className={styles.invitationActions} data-reveal>
          <Link href="/get-involved" className={styles.solidButton}>
            Be part of our beginning <Arrow diagonal />
          </Link>
          <Link href="/calendar" className={styles.textLink}>
            Gather with us <Arrow />
          </Link>
        </div>
        <span className={styles.invitationLine} aria-hidden="true" />
      </section>

      <CinematicFooter backTo="#about-content" />
    </div>
  );
}

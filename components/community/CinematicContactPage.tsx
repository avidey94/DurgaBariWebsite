import Link from "next/link";
import { Arrow } from "@/components/home/CinematicIcons";
import { CommunityHero, CommunityInvitation, CommunityPage } from "./CommunityPage";
import styles from "./CommunityPages.module.css";

const contactFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSfW4TMdgsWg9SRWF4CBEZ0H5cwPEm99sFSwNkjzpuAN9Bciuw/viewform";

export function CinematicContactPage() {
  return (
    <CommunityPage page="contact">
      <CommunityHero
        page="contact"
        label="Contact"
        bengali="আসুন, কথা বলি।"
        title={
          <>
            Every connection
            <br />
            begins with
            <br />
            <em>a hello.</em>
          </>
        }
        lead="A question, an idea, or a wish to be part of something meaningful. We would love to hear from you."
        image="/home/community-gathering.jpeg"
        imageAlt="Durga Bari community members listening and sharing ideas at an early gathering"
        caption="Good things begin when we come together."
      >
        <a href="#contact-form" className={styles.solidButton}>
          Send a message
          <Arrow diagonal />
        </a>
        <a href="mailto:info@thedurgacenter.org" className={styles.textLink}>
          Email us
          <Arrow />
        </a>
      </CommunityHero>

      <nav className={styles.quickLinks} aria-label="Ways to connect">
        <a href="#contact-form">
          <span>01</span>Write to us
          <Arrow />
        </a>
        <a href="#find-us">
          <span>02</span>Find us in San Jose
          <Arrow />
        </a>
        <Link href="/get-involved">
          <span>03</span>Give your time
          <Arrow />
        </Link>
      </nav>

      <section id="contact-form" className={styles.contactSection} aria-labelledby="message-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>An open door, a listening ear</p>
          <h2 id="message-title">
            Let’s start
            <br />
            <em>a conversation.</em>
          </h2>
          <p>
            Ask about worship, our community, volunteering, or ways to support Durga Bari. Use the
            form below, or reach us directly by email.
          </p>
        </div>
        <div className={styles.contactGrid}>
          <div className={styles.formPanel}>
            <div className={styles.formHeading}>
              <span className={styles.eyebrow}>Your message</span>
              <span>Durga Bari community</span>
            </div>
            <iframe
              title="Durga Bari contact form"
              src={`${contactFormUrl}?embedded=true`}
              loading="lazy"
              height={1560}
            />
            <p className={styles.formFallback}>
              Prefer a separate window?{" "}
              <a href={contactFormUrl} target="_blank" rel="noopener noreferrer">
                Open the contact form
                <Arrow diagonal />
              </a>
            </p>
          </div>
          <aside className={styles.contactAside} aria-label="Contact details">
            <div className={styles.asideBlock}>
              <p className={styles.eyebrow}>01 / Reach us directly</p>
              <h3>A note is all it takes.</h3>
              <p>For questions, ideas, and offers to help, write to our community team.</p>
              <a href="mailto:info@thedurgacenter.org" className={styles.emailLink}>
                info@thedurgacenter.org
                <Arrow diagonal />
              </a>
            </div>
            <div id="find-us" className={styles.asideBlock}>
              <p className={styles.eyebrow}>02 / Visit Durga Bari</p>
              <h3>Find us in San Jose.</h3>
              <address>
                2350 Paragon Dr
                <br />
                San Jose, CA 95131
              </address>
              <a
                href="https://maps.google.com/?q=2350+Paragon+Dr,+San+Jose,+CA+95131"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.textLink}
              >
                Get directions
                <Arrow diagonal />
              </a>
              <p className={styles.visitNote}>
                Planning a visit? Check our <Link href="/calendar">calendar</Link> for upcoming
                worship and community gatherings.
              </p>
            </div>
            <div className={styles.asideInvitation}>
              <p className={styles.eyebrow}>03 / Be part of the beginning</p>
              <h3>
                Bring a little
                <br />
                <em>of yourself.</em>
              </h3>
              <p>
                Your time, your skills, your willingness to help. There is a place for you here.
              </p>
              <Link href="/get-involved" className={styles.textLink}>
                Find your way to help
                <Arrow />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <CommunityInvitation
        eyebrow="More than a place to visit"
        title={
          <>
            Come for a prayer.
            <br />
            <em>Find a community.</em>
          </>
        }
        primaryHref="/calendar"
        primaryLabel="Find our next gathering"
        secondaryHref="/about"
        secondaryLabel="Get to know us"
      >
        Every shared prayer and every new connection helps this home grow. We invite you to be part
        of what comes next.
      </CommunityInvitation>
    </CommunityPage>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Arrow, Trishul } from "@/components/home/CinematicIcons";
import { CommunityHero, CommunityInvitation, CommunityPage } from "./CommunityPage";
import styles from "./CommunityPages.module.css";

const opportunities = [
  {
    label: "Awareness ambassadors",
    title: "Carry the story forward.",
    body: "Share the vision of Durga Bari with friends, family, and neighbors. Invite someone to a gathering and help more people find their place in this growing community.",
    action: "Help spread the word",
    subject: "I’d like to help share the Durga Bari vision",
  },
  {
    label: "Fundraising volunteers",
    title: "Turn shared hope into action.",
    body: "Lend a hand with fundraising events, community campaigns, and donor outreach. Your ideas, planning skills, and time can help lay the foundations of a lasting home.",
    action: "Help with fundraising",
    subject: "I’d like to volunteer for fundraising",
  },
  {
    label: "Patron & sponsor outreach",
    title: "Make a meaningful connection.",
    body: "Introduce us to patrons, sponsors, and well-wishers who share our vision. Help build the relationships that can sustain a spiritual and cultural home for generations.",
    action: "Connect a supporter",
    subject: "I’d like to help with patron and sponsor outreach",
  },
] as const;

const futureOpportunities = [
  {
    title: "Worship & temple care",
    body: "Supporting rituals, daily operations, and the care of our sacred space.",
  },
  {
    title: "Culture & learning",
    body: "Helping with cultural and educational programs that connect generations.",
  },
  {
    title: "Festivals & gatherings",
    body: "Bringing people together through celebrations and community events.",
  },
  {
    title: "A welcoming home",
    body: "Helping maintain the beauty of the temple and a welcoming place for everyone.",
  },
] as const;

export function CinematicGetInvolvedPage() {
  return (
    <CommunityPage page="get-involved">
      <CommunityHero
        page="get-involved"
        label="Get involved"
        bengali="একসাথে গড়ি মায়ের বাড়ি।"
        title={
          <>
            Your time.
            <br />
            Your heart.
            <br />
            <em>A lasting home.</em>
          </>
        }
        lead="A home for Maa Durga grows through the people who care for it. Bring your skills, share your ideas, or simply begin with a willingness to help."
        image="/home/community-together.jpeg"
        imageAlt="Members of the Durga Bari community coming together to shape the center’s future"
        caption="A shared vision, made real by people."
      >
        <a href="#ways-to-help" className={styles.solidButton}>
          Find your way to help
          <Arrow diagonal />
        </a>
        <Link href="/contact" className={styles.textLink}>
          Let’s talk
          <Arrow />
        </Link>
      </CommunityHero>

      <div className={styles.sevaNote}>
        <Trishul />
        <p>
          <span>Seva</span> The spirit of service. The simple act of showing up for one another.
        </p>
        <span className={styles.sevaBengali} lang="bn">
          সেবায় সংযোগ, একসাথে পথচলা।
        </span>
      </div>

      <section id="ways-to-help" className={styles.waysSection} aria-labelledby="ways-title">
        <div className={styles.waysHeading}>
          <p className={styles.eyebrow}>01 / How you can help now</p>
          <h2 id="ways-title">
            Small beginnings.
            <br />
            <em>Lasting meaning.</em>
          </h2>
          <p>
            You do not need to have it all figured out. Start with the way of helping that feels
            right for you, and we can take it from there.
          </p>
          <Link href="/contact" className={styles.textLink}>
            Not sure where to start?
            <Arrow />
          </Link>
        </div>
        <div className={styles.opportunities}>
          {opportunities.map((item, index) => (
            <article key={item.label}>
              <span className={styles.opportunityNumber}>0{index + 1}</span>
              <div>
                <p className={styles.eyebrow}>{item.label}</p>
                <h3>{item.title}</h3>
                <p className={styles.opportunityBody}>{item.body}</p>
                <a
                  href={`mailto:info@thedurgacenter.org?subject=${encodeURIComponent(item.subject)}`}
                  className={styles.textLink}
                >
                  {item.action}
                  <Arrow diagonal />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.togetherSection} aria-labelledby="together-title">
        <figure>
          <div className={styles.togetherPhoto}>
            <Image
              src="/home/community-gathering.jpeg"
              alt="Durga Bari community members listening to one another at an early community meeting"
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
            />
          </div>
          <figcaption>Our own community. The people behind this beginning.</figcaption>
        </figure>
        <div className={styles.togetherCopy}>
          <p className={styles.eyebrow}>A place for your contribution</p>
          <h2 id="together-title">
            Many hands.
            <br />
            <em>One shared purpose.</em>
          </h2>
          <p>
            Durga Bari is more than a temple. It is a growing center of spirituality, Bengali
            culture, and community. Every conversation, every introduction, and every hour offered
            helps bring that vision to life.
          </p>
          <Link href="/about" className={styles.textLink}>
            Discover the vision we share
            <Arrow />
          </Link>
        </div>
      </section>

      <section className={styles.futureSection} aria-labelledby="future-title">
        <div className={styles.futureHeading}>
          <p className={styles.eyebrow}>02 / Looking ahead</p>
          <h2 id="future-title">
            As our home grows,
            <br />
            <em>so will the ways to give.</em>
          </h2>
          <p>
            As the Mandir grows, we envision more opportunities to serve. Tell us what you enjoy
            doing and where you would like to contribute as these programs take shape.
          </p>
        </div>
        <ol className={styles.futureList}>
          {futureOpportunities.map((item, index) => (
            <li key={item.title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <CommunityInvitation
        eyebrow="This beginning belongs to all of us"
        title={
          <>
            However you begin,
            <br />
            <em>you belong here.</em>
          </>
        }
        primaryHref="mailto:info@thedurgacenter.org?subject=I%27d%20like%20to%20get%20involved%20with%20Durga%20Bari"
        primaryLabel="Tell us how you’d like to help"
        secondaryHref="/contact"
        secondaryLabel="Contact our community"
      >
        A little time, a new idea, a helping hand. Reach out and tell us what you have in mind. We
        would love to begin the conversation.
      </CommunityInvitation>
    </CommunityPage>
  );
}

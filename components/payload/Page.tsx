import { getCurrentUser } from '@/lib/auth/session';
import { listCalendarEvents } from '@/lib/events/server';
import { env } from '@/lib/env';
import type { PageBlock, PayloadPage } from '@/lib/payload/pages';
import styles from './AboutPage.module.css';

function Arrow() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function safeImage(value?: string) {
  return value && ((value.startsWith('/') && !value.startsWith('//')) || value.startsWith('https://')) ? value : undefined;
}

function safeLink(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return `${url.pathname}${url.search}${url.hash}`;
    return url.protocol === 'https:' ? value : '#';
  } catch { return '#'; }
}

function FeatureHeading({ block }: { block: Extract<PageBlock, { blockType: 'featureSlot' }> }) {
  return <div className={styles.featureHeading}>{block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}{block.headline && <h2>{block.headline}</h2>}{block.body && <p>{block.body}</p>}</div>;
}

async function Feature({ block }: { block: Extract<PageBlock, { blockType: 'featureSlot' }> }) {
  if (block.feature === 'upcomingEvents') {
    const now = new Date();
    const events = await listCalendarEvents({
      includeDraft: false, includePrivate: false, includeMembers: false,
      fromIso: now.toISOString(),
      toIso: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    }).then((items) => items.slice(0, 3));
    return <section className={`${styles.section} ${styles.feature}`}><FeatureHeading block={block} />
      {events.length ? <div className={styles.eventList}>{events.map((entry) => <a key={entry.occurrenceKey} href={`/events-festivals/${entry.event.slug}?occurrenceStart=${encodeURIComponent(entry.occurrenceStart)}`}><time dateTime={entry.occurrenceStart}>{new Date(entry.occurrenceStart).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' })}</time><strong>{entry.event.title}</strong><Arrow /></a>)}</div> : <p className={styles.featureEmpty}>There are no upcoming public events listed yet.</p>}
      <a className={styles.featureLink} href="/events-festivals">See the calendar <Arrow /></a>
    </section>;
  }

  if (block.feature === 'visit') return <section className={`${styles.section} ${styles.feature} ${styles.visit}`}><div><FeatureHeading block={block} /><address>2350 Paragon Dr<br />San Jose, CA 95131</address><a className={styles.featureLink} href="https://maps.google.com/?q=2350+Paragon+Dr,+San+Jose,+CA+95131">Get directions <Arrow /></a></div><iframe title="Durga Bari location map" src="https://www.google.com/maps?q=2350%20Paragon%20Dr%2C%20San%20Jose%2C%20CA%2095131&z=15&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></section>;

  if (block.feature === 'memberPortal') {
    const user = await getCurrentUser();
    return <section className={`${styles.section} ${styles.feature} ${styles.member}`}><FeatureHeading block={block} /><a className={styles.featureLink} href={user ? '/portal' : '/login'}>{user ? 'Member portal' : 'Member login'} <Arrow /></a></section>;
  }

  if (block.feature === 'livestream') {
    const embedUrl = env.youtubeLiveEmbedUrl.trim();
    if (!embedUrl) return null;
    return <section className={`${styles.section} ${styles.feature} ${styles.live}`}><FeatureHeading block={block} /><iframe src={embedUrl} title={block.headline || 'Durga Bari livestream'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></section>;
  }

  if (block.feature === 'contactForm') return <section className={`${styles.section} ${styles.feature} ${styles.contact}`}><div><FeatureHeading block={block} /><a href="mailto:info@thedurgacenter.org">info@thedurgacenter.org</a><address>2350 Paragon Dr<br />San Jose, CA 95131</address></div><iframe title="Contact Durga Bari" src="https://docs.google.com/forms/d/e/1FAIpQLSfW4TMdgsWg9SRWF4CBEZ0H5cwPEm99sFSwNkjzpuAN9Bciuw/viewform?embedded=true" loading="lazy" /></section>;

  if (block.feature === 'donationMethods') return <section className={`${styles.section} ${styles.feature}`}><FeatureHeading block={block} /><div className={styles.givingGrid}>
    <div><span>01</span><h3>Give online</h3><p>Choose the platform that works best for you.</p><a className={styles.featureLink} href="https://www.zeffy.com/en-US/donation-form/support-durga-bari-sustaining-spiritual-and-community-wellbeing">Donate with Zeffy <Arrow /></a><a className={styles.featureLink} href="https://www.paypal.com/ncp/payment/PBSF3LY72MJSC">Donate with PayPal <Arrow /></a></div>
    <div><span>02</span><h3>Give through Zelle</h3><p>Scan the QR code with your banking app and confirm the recipient is Durga Bari.</p><img src="/durgacenter/zelle-qr.jpg" alt="Durga Bari Zelle QR code" /></div>
    <div><span>03</span><h3>Give by check</h3><p>Make checks payable to Durga Bari – Center for Spiritual and Cultural Excellence.</p><address>2200 Eastridge Loop #731192<br />San Jose, CA 95173</address></div>
  </div><p className={styles.taxNote}>Durga Bari – Center for Spiritual and Cultural Excellence is a 501(c)(3) nonprofit organization. EIN: 39-4854019.</p></section>;

  return null;
}

function Section({ block, number }: { block: PageBlock; number: number }) {
  if (block.blockType === 'story') return <section className={`${styles.section} ${styles.split}`}>
    <div className={styles.heading}><span className={styles.index}>{number}</span><p className={styles.eyebrow}>{block.eyebrow}</p><h2>{block.headline}</h2></div>
    <p className={styles.storyBody}>{block.body}</p>
  </section>;

  if (block.blockType === 'principles') return <section className={`${styles.section} ${styles.split}`}>
    <div className={styles.heading}><span className={styles.index}>{number}</span><p className={styles.eyebrow}>{block.eyebrow}</p><h2>{block.headline || 'What guides us.'}</h2></div>
    <div className={styles.principles}>{block.items?.map((item, index) => <div className={styles.principle} key={item.id || index}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></div>)}</div>
  </section>;

  if (block.blockType === 'imageStory') return <section className={`${styles.section} ${styles.imageStory}`}>
    <div className={styles.storyImage}>{safeImage(block.imageUrl) && <img src={safeImage(block.imageUrl)} alt={block.imageAlt || ''} />}</div>
    <div className={styles.heading}><span className={styles.index}>{number}</span><p className={styles.eyebrow}>{block.eyebrow}</p><h2>{block.headline}</h2><p className={styles.imageBody}>{block.body}</p></div>
  </section>;

  if (block.blockType === 'quote') return <figure className={`${styles.section} ${styles.quote}`}><span aria-hidden="true">“</span><blockquote>{block.quote}</blockquote>{block.attribution && <figcaption>{block.attribution}</figcaption>}</figure>;

  if (block.blockType === 'callToAction') return <section className={`${styles.section} ${styles.invitation}`}><div><p className={styles.eyebrow}>An invitation</p><h2>{block.headline}</h2><p>{block.body}</p></div><a href={safeLink(block.linkUrl)}>{block.linkLabel}<Arrow /></a></section>;

  if (block.blockType === 'featureSlot') return <Feature block={block} />;
  return null;
}

export function PayloadPageView({ page }: { page: PayloadPage }) {
  const image = safeImage(page.hero.imageUrl);
  return <article className={styles.page}>
    <header className={image ? styles.hero : `${styles.hero} ${styles.heroWithoutImage}`}>
      <div className={styles.heroCopy}><p className={styles.eyebrow}>{page.hero.eyebrow}</p><h1>{page.hero.headline}</h1><p className={styles.lead}>{page.hero.lead}</p><span className={styles.rule} /></div>
      {image && <div className={styles.heroImage}><img src={image} alt={page.hero.imageAlt || ''} /></div>}
    </header>
    <div className={styles.stack}>{page.layout.map((block, index) => <Section block={block} number={index + 1} key={block.id || index} />)}</div>
  </article>;
}

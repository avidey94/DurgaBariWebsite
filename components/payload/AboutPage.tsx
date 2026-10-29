import type { AboutBlock, PayloadAboutPage } from '@/lib/payload/about';
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

function Section({ block, number }: { block: AboutBlock; number: number }) {
  if (block.blockType === 'story') return <section className={`${styles.section} ${styles.split}`}>
    <div className={styles.heading}><span className={styles.index}>{number}</span><p className={styles.eyebrow}>{block.eyebrow}</p><h2>{block.headline}</h2></div>
    <p className={styles.storyBody}>{block.body}</p>
  </section>;

  if (block.blockType === 'principles') return <section className={`${styles.section} ${styles.split}`}>
    <div className={styles.heading}><span className={styles.index}>{number}</span><p className={styles.eyebrow}>{block.eyebrow}</p><h2>What guides us.</h2></div>
    <div className={styles.principles}>{block.items?.map((item, index) => <div className={styles.principle} key={item.id || index}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></div>)}</div>
  </section>;

  if (block.blockType === 'imageStory') return <section className={`${styles.section} ${styles.imageStory}`}>
    <div className={styles.storyImage}>{safeImage(block.imageUrl) && <img src={safeImage(block.imageUrl)} alt={block.imageAlt || ''} />}</div>
    <div className={styles.heading}><span className={styles.index}>{number}</span><p className={styles.eyebrow}>{block.eyebrow}</p><h2>{block.headline}</h2><p className={styles.imageBody}>{block.body}</p></div>
  </section>;

  if (block.blockType === 'quote') return <figure className={`${styles.section} ${styles.quote}`}><span aria-hidden="true">“</span><blockquote>{block.quote}</blockquote>{block.attribution && <figcaption>{block.attribution}</figcaption>}</figure>;

  if (block.blockType === 'callToAction') return <section className={`${styles.section} ${styles.invitation}`}><div><p className={styles.eyebrow}>An invitation</p><h2>{block.headline}</h2><p>{block.body}</p></div><a href={safeLink(block.linkUrl)}>{block.linkLabel}<Arrow /></a></section>;

  return null;
}

export function PayloadAboutPageView({ page }: { page: PayloadAboutPage }) {
  const image = safeImage(page.hero.imageUrl);
  return <article className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.heroCopy}><p className={styles.eyebrow}>{page.hero.eyebrow}</p><h1>{page.hero.headline}</h1><p className={styles.lead}>{page.hero.lead}</p><span className={styles.rule} /></div>
      {image && <div className={styles.heroImage}><img src={image} alt={page.hero.imageAlt || ''} /></div>}
    </header>
    <div className={styles.stack}>{page.layout.map((block, index) => <Section block={block} number={index + 1} key={block.id || index} />)}</div>
  </article>;
}

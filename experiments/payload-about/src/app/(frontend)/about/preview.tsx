'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { useEffect, useState } from 'react'
import type { Page } from '@/payload-types'

type HighlightedSection = { rowId: string; index: number } | null

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M3 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function safeLink(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try { return new URL(value).protocol === 'https:' ? value : '#' } catch { return '#' }
}

function Section({ block, number, highlighted }: { block: NonNullable<Page['layout']>[number]; number: number; highlighted: boolean }) {
  const highlight = highlighted ? ' section-shell--highlighted' : ''
  switch (block.blockType) {
    case 'story':
      return <section className={`story-section section-shell${highlight}`} data-row-id={block.id}>
        <div className="section-heading"><span className="section-index">{number}</span><p className="eyebrow">{block.eyebrow}</p><h2>{block.headline}</h2></div>
        <p className="section-body">{block.body}</p>
      </section>
    case 'principles':
      return <section className={`principles-section section-shell${highlight}`} data-row-id={block.id}>
        <div className="section-heading"><span className="section-index">{number}</span><p className="eyebrow">{block.eyebrow}</p><h2>{block.headline || 'What guides us.'}</h2></div>
        <div className="principles-list">{block.items?.map((item, index) => <div className="principle" key={item.id || index}><span className="principle-number">0{index + 1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></div>)}</div>
      </section>
    case 'imageStory':
      return <section className={`image-story section-shell${highlight}`} data-row-id={block.id}>
        <div className="image-story-media"><img src={block.imageUrl} alt={block.imageAlt} /></div>
        <div className="image-story-copy"><span className="section-index">{number}</span><p className="eyebrow">{block.eyebrow}</p><h2>{block.headline}</h2><p>{block.body}</p></div>
      </section>
    case 'quote':
      return <figure className={`quote-section section-shell${highlight}`} data-row-id={block.id}><span className="quote-mark">“</span><blockquote>{block.quote}</blockquote>{block.attribution && <figcaption>{block.attribution}</figcaption>}</figure>
    case 'callToAction':
      return <section className={`invitation-section section-shell${highlight}`} data-row-id={block.id}><div><p className="eyebrow">An invitation</p><h2>{block.headline}</h2><p>{block.body}</p></div><a href={safeLink(block.linkUrl)}>{block.linkLabel}<ArrowIcon /></a></section>
    case 'featureSlot':
      return <section className={`story-section section-shell${highlight}`} data-row-id={block.id}>
        <div className="section-heading"><span className="section-index">{number}</span><p className="eyebrow">{block.eyebrow || 'Site feature'}</p><h2>{block.headline}</h2></div>
        <div><p className="section-body">{block.body}</p><p className="feature-preview-note">{block.feature.replace(/([A-Z])/g, ' $1')} · Live content appears on the public website.</p></div>
      </section>
    default:
      return null
  }
}

export function AboutPreview({ initialPage, isPreview, serverURL }: { initialPage: Page; isPreview: boolean; serverURL: string }) {
  const { data: livePage } = useLivePreview<Page>({ initialData: initialPage, serverURL })
  const page = isPreview ? livePage : initialPage
  const hero = page.hero
  const [highlightedSection, setHighlightedSection] = useState<HighlightedSection>(null)

  useEffect(() => {
    if (!isPreview || window.parent === window) return
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (event.data?.type !== 'durga-bari-section-highlight') return
      const { rowId, index } = event.data
      setHighlightedSection(typeof rowId === 'string' && Number.isInteger(index) ? { rowId, index } : null)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'durga-bari-preview-ready' }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [isPreview])

  useEffect(() => {
    if (!highlightedSection) return
    const timer = window.setTimeout(() => {
      const sections = [...document.querySelectorAll<HTMLElement>('.section-stack > .section-shell')]
      const target = sections.find((section) => section.dataset.rowId === highlightedSection.rowId) || sections[highlightedSection.index]
      if (!target) return
      const bounds = target.getBoundingClientRect()
      if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' })
      }
    }, 140)
    return () => window.clearTimeout(timer)
  }, [highlightedSection, page.layout])

  const highlightedIdExists = page.layout?.some((section) => section.id === highlightedSection?.rowId)

  return <>
    <header className="site-header"><a href={`/${page.slug === 'home' ? '' : page.slug}`} className="brand"><img src="/durgacenter/logo.png" alt="" /><span><strong>Durga Bari</strong><small>Center for Spiritual and Cultural Excellence</small></span></a><nav aria-label="Preview navigation"><a href="/admin">Page studio <ArrowIcon /></a></nav></header>
    {isPreview && <div className="preview-note">Draft preview · Changes here stay in the page studio until published.</div>}
    <main>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">{hero?.eyebrow}</p><h1>{hero?.headline}</h1><p className="hero-lead">{hero?.lead}</p><span className="hero-rule" /></div>{hero?.imageUrl && <div className="hero-media"><img src={hero.imageUrl} alt={hero.imageAlt || ''} /><span>Durga Bari · Our beginning</span></div>}</section>
      <div className="section-stack">{page.layout?.map((block, index) => <Section key={block.id || index} block={block} number={index + 1} highlighted={highlightedSection?.rowId === block.id || (!highlightedIdExists && highlightedSection?.index === index)} />)}</div>
    </main>
    <footer className="site-footer"><span>Durga Bari</span><span>A home for devotion, culture, and community.</span></footer>
  </>
}

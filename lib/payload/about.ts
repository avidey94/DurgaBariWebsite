export type AboutBlock =
  | { id?: string; blockType: 'story'; eyebrow: string; headline: string; body: string }
  | { id?: string; blockType: 'principles'; eyebrow: string; items: Array<{ id?: string; title: string; body: string }> }
  | { id?: string; blockType: 'imageStory'; eyebrow: string; headline: string; body: string; imageUrl: string; imageAlt: string }
  | { id?: string; blockType: 'quote'; quote: string; attribution?: string }
  | { id?: string; blockType: 'callToAction'; headline: string; body: string; linkLabel: string; linkUrl: string };

export interface PayloadAboutPage {
  slug: string;
  title: string;
  _status: 'published';
  hero: { eyebrow: string; headline: string; lead: string; imageUrl?: string; imageAlt?: string };
  layout: AboutBlock[];
}

export async function getPublishedPayloadAbout(): Promise<PayloadAboutPage | null> {
  const base = process.env.PAYLOAD_PUBLIC_URL?.trim();
  if (!base) return null;

  try {
    const url = new URL('/api/pages', base);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && url.hostname === '127.0.0.1')) return null;
    url.searchParams.set('where[slug][equals]', 'about');
    url.searchParams.set('limit', '1');
    url.searchParams.set('depth', '0');
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || !('docs' in result) || !Array.isArray(result.docs)) return null;
    const page = result.docs[0];
    if (!page || page.slug !== 'about' || page._status !== 'published' ||
      !page.hero || typeof page.hero.headline !== 'string' || !Array.isArray(page.layout)) return null;
    return page as PayloadAboutPage;
  } catch (error) {
    console.error('[payload] Published About page could not be loaded', error);
    return null;
  }
}

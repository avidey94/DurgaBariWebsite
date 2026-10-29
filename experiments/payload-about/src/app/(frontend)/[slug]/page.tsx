import config from '@/payload.config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { AboutPreview } from '../about/preview'

export const dynamic = 'force-dynamic'

export default async function EditorialPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params
  const query = await searchParams
  const requestHeaders = await headers()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: requestHeaders })
  const preview = query.preview === '1' && Boolean(user)
  const result = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, draft: preview })
  const page = result.docs[0]

  if (!page) return <main className="setup-message"><h1>Page not found.</h1><p>Publish this page in Page Studio, then reload.</p></main>

  const origin = `${requestHeaders.get('x-forwarded-proto') || 'http'}://${requestHeaders.get('host') || 'localhost:3200'}`
  return <AboutPreview initialPage={page} isPreview={preview} serverURL={origin} />
}

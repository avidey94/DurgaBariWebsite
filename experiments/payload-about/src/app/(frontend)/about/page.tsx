import config from '@/payload.config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { AboutPreview } from './preview'

export const dynamic = 'force-dynamic'

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams
  const requestHeaders = await headers()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: requestHeaders })
  const preview = params.preview === '1' && Boolean(user)
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'about' } },
    limit: 1,
    draft: preview,
  })
  const page = result.docs[0]

  if (!page) {
    return <main className="setup-message"><h1>About preview is being prepared.</h1><p>Run the local seed command, then reload this page.</p></main>
  }

  const origin = `${requestHeaders.get('x-forwarded-proto') || 'http'}://${requestHeaders.get('host') || 'localhost:3200'}`
  return <AboutPreview initialPage={page} isPreview={preview} serverURL={origin} />
}
